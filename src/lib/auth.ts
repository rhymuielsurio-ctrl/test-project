import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { AppError } from "./errors";
import { getPool, isDatabaseConfigured } from "./db";

export type UserRole = "employee" | "manager" | "hr_admin";

export interface MockSession {
  userId: string;
  role: UserRole;
  name: string;
}

interface DbUserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  manager_id: string | null;
  password_hash: string;
}

const DUMMY_PASSWORD_HASH = "$2b$10$4LUoAi6yFaBSdmkdGKdIjO/7eZI5aamELO2jeqy.IJ/xHuwGkMCa.";

export const SESSION_COOKIE_NAME = "session";
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export async function findUserByEmail(email: string): Promise<DbUserRow | null> {
  const { rows } = await getPool().query<DbUserRow>(
    `SELECT id, name, email, role, manager_id, password_hash
       FROM users
      WHERE email = $1
      LIMIT 1`,
    [email],
  );
  return rows[0] ?? null;
}

export async function verifyLoginPassword(
  password: string,
  user: Pick<DbUserRow, "password_hash"> | null,
): Promise<boolean> {
  const hash = user?.password_hash ?? DUMMY_PASSWORD_HASH;
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await getPool().query(
    `INSERT INTO sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, hashToken(token), expiresAt],
  );

  return { token, expiresAt };
}

export async function deleteSessionByToken(token: string): Promise<void> {
  if (!token) return;
  await getPool().query(`DELETE FROM sessions WHERE token_hash = $1`, [hashToken(token)]);
}

export async function getMockSession(): Promise<MockSession | null> {
  if (!isDatabaseConfigured()) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const { rows } = await getPool().query<{
    id: string;
    name: string;
    role: UserRole;
  }>(
    `SELECT u.id, u.name, u.role
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.expires_at > now()
      LIMIT 1`,
    [hashToken(token)],
  );

  const row = rows[0];
  if (!row) return null;

  return { userId: row.id, role: row.role, name: row.name };
}

export async function requireAuth(allowedRoles?: UserRole[]): Promise<MockSession> {
  const session = await getMockSession();
  if (!session) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    throw new AppError("FORBIDDEN", "Insufficient permissions", 403);
  }
  return session;
}

/**
 * Idempotent Day-1 seed — bcrypt password hashes + dev accounts.
 * Safe to run multiple times; an existing password_hash is never reset.
 *
 * Usage: npx tsx scripts/seed.ts
 * Requires DATABASE_URL env var (plain Postgres).
 */

import bcrypt from "bcryptjs";
import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

interface SeedAccount {
  id: string;
  name: string;
  email: string;
  role: "employee" | "manager" | "hr_admin";
  managerId: string | null;
  devPassword: string;
}

const ACCOUNTS: SeedAccount[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Alice Chen",
    email: "alice@example.com",
    role: "employee",
    managerId: "00000000-0000-0000-0000-000000000002",
    devPassword: "alice-dev-pass",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Bob Manager",
    email: "bob@example.com",
    role: "manager",
    managerId: null,
    devPassword: "bob-dev-pass",
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    name: "Carol Admin",
    email: "carol@example.com",
    role: "hr_admin",
    managerId: null,
    devPassword: "carol-dev-pass",
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    name: "Dave Employee",
    email: "dave@example.com",
    role: "employee",
    managerId: "00000000-0000-0000-0000-000000000002",
    devPassword: "dave-dev-pass",
  },
];

async function seedUser(account: SeedAccount): Promise<void> {
  const { rows } = await pool.query<{ password_hash: string }>(
    `SELECT password_hash FROM users WHERE id = $1`,
    [account.id],
  );

  const currentHash = rows[0]?.password_hash ?? "";
  const hash = currentHash ? currentHash : await bcrypt.hash(account.devPassword, 10);

  await pool.query(
    `INSERT INTO users (id, name, email, role, manager_id, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       email = EXCLUDED.email,
       role = EXCLUDED.role,
       manager_id = EXCLUDED.manager_id,
       password_hash = EXCLUDED.password_hash`,
    [account.id, account.name, account.email, account.role, account.managerId, hash],
  );
}

async function seedLeaveDomain(): Promise<void> {
  await pool.query(
    `INSERT INTO leave_policies (user_id, leave_type_id, accrual_per_month)
     SELECT u.id, lt.id, vals.accrual_per_month
       FROM   (VALUES
                 ('00000000-0000-0000-0000-000000000001'::uuid, 'vacation'::text, 1.25::numeric(4,2)),
                 ('00000000-0000-0000-0000-000000000001', 'sick',     1.00),
                 ('00000000-0000-0000-0000-000000000004', 'vacation', 1.25),
                 ('00000000-0000-0000-0000-000000000004', 'sick',     1.00)
               ) AS vals(user_id, code, accrual_per_month)
       JOIN   users      u  ON u.id  = vals.user_id
       JOIN   leave_types lt ON lt.code = vals.code
     ON CONFLICT (user_id, leave_type_id) DO UPDATE
       SET accrual_per_month = EXCLUDED.accrual_per_month`,
  );

  await pool.query(
    `INSERT INTO leave_balances (user_id, leave_type_id, balance, updated_at, accrued_at)
     SELECT u.id, lt.id, vals.balance, now(), NULL
       FROM   (VALUES
                 ('00000000-0000-0000-0000-000000000001'::uuid, 'vacation'::text, 10.00::numeric(5,2)),
                 ('00000000-0000-0000-0000-000000000001', 'sick',     8.00),
                 ('00000000-0000-0000-0000-000000000004', 'vacation',  5.00),
                 ('00000000-0000-0000-0000-000000000004', 'sick',     12.00)
               ) AS vals(user_id, code, balance)
       JOIN   users      u  ON u.id  = vals.user_id
       JOIN   leave_types lt ON lt.code = vals.code
     ON CONFLICT (user_id, leave_type_id) DO NOTHING`,
  );
}

async function seed() {
  console.log("Seeding auth accounts (users)...");
  for (const account of ACCOUNTS) {
    await seedUser(account);
    console.log(`  ✓ ${account.email} (${account.role})`);
  }
  console.log("\nSeeding leave domain (policies + balances)...");
  await seedLeaveDomain();
  console.log("  ✓ leave_policies + leave_balances");
  console.log("\nSeed complete. Dev credentials:");
  for (const account of ACCOUNTS) {
    console.log(`  ${account.email} / ${account.devPassword}`);
  }
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });

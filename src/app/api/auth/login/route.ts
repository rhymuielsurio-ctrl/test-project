import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { AppError, handleApiError } from "@/lib/errors";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSession,
  findUserByEmail,
  verifyLoginPassword,
} from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

interface LoginBody {
  email?: string;
  password?: string;
}

export async function POST(request: NextRequest) {
  try {
    checkRateLimit(request, "login");

    let body: LoginBody;
    try {
      body = await request.json();
    } catch {
      throw new AppError("VALIDATION_ERROR", "Invalid JSON body");
    }

    const email = body.email?.trim();
    const password = body.password;

    if (!email || !password) {
      throw new AppError("VALIDATION_ERROR", "Email and password are required");
    }

    if (!isDatabaseConfigured()) {
      throw new AppError("CONFIGURATION_ERROR", "Database is not configured", 500);
    }

    const user = await findUserByEmail(email);
    const passwordValid = await verifyLoginPassword(password, user);
    if (!user || !passwordValid) {
      throw new AppError("UNAUTHORIZED", "Invalid email or password", 401);
    }

    const { token } = await createSession(user.id);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return Response.json(
      {
        success: true,
        data: { userId: user.id, role: user.role, name: user.name },
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

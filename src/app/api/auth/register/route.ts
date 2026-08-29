import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { AppError, handleApiError } from "@/lib/errors";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSession,
  createUser,
} from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

interface RegisterBody {
  name?: string;
  email?: string;
  password?: string;
}

export async function POST(request: NextRequest) {
  try {
    let body: RegisterBody;
    try {
      body = await request.json();
    } catch {
      throw new AppError("VALIDATION_ERROR", "Invalid JSON body");
    }

    const name = body.name?.trim();
    const email = body.email?.trim();
    const password = body.password;

    if (!name) {
      throw new AppError("VALIDATION_ERROR", "Name is required");
    }
    if (!email || !EMAIL_PATTERN.test(email)) {
      throw new AppError("VALIDATION_ERROR", "A valid email is required");
    }
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      );
    }

    if (!isDatabaseConfigured()) {
      throw new AppError("CONFIGURATION_ERROR", "Database is not configured", 500);
    }

    const user = await createUser({ name, email, password });

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
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

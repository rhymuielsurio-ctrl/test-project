import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSession,
  findOrCreateGoogleUser,
} from "@/lib/auth";
import {
  exchangeCodeForTokens,
  fetchGoogleUserInfo,
  requireGoogleAuthConfigured,
} from "@/lib/google-auth";

const STATE_COOKIE_NAME = "oauth_state";
const LOGIN_FAILED_URL = "/login?error=google_sso_failed";
const LOGIN_SUCCESS_URL = "/leave-requests";

function redirectToLoginWithError(origin: string): NextResponse {
  return NextResponse.redirect(new URL(LOGIN_FAILED_URL, origin), 303);
}

function safeStateEqual(expected: string, actual: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(actual);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;

  try {
    checkRateLimit(request, "google");
    requireGoogleAuthConfigured();

    const cookieStore = await cookies();
    const storedState = cookieStore.get(STATE_COOKIE_NAME)?.value;
    cookieStore.set(STATE_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    if (!code || !state || !storedState || !safeStateEqual(storedState, state)) {
      return redirectToLoginWithError(origin);
    }

    const redirectUri = `${origin}/api/auth/google/callback`;
    const { accessToken } = await exchangeCodeForTokens({ code, redirectUri });
    const info = await fetchGoogleUserInfo(accessToken);
    if (!info.emailVerified || !info.email) {
      return redirectToLoginWithError(origin);
    }

    const user = await findOrCreateGoogleUser({
      email: info.email,
      name: info.name ?? info.email.split("@")[0],
    });

    const { token } = await createSession(user.id);
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return NextResponse.redirect(new URL(LOGIN_SUCCESS_URL, origin), 303);
  } catch (error) {
    console.error("[api] auth/google/callback error:", error);
    return redirectToLoginWithError(origin);
  }
}

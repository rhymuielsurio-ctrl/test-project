import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { handleApiError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { buildGoogleAuthUrl, requireGoogleAuthConfigured } from "@/lib/google-auth";

const STATE_COOKIE_NAME = "oauth_state";
const STATE_MAX_AGE_SECONDS = 600;

export async function GET(request: NextRequest) {
  try {
    checkRateLimit(request, "google");
    requireGoogleAuthConfigured();

    const state = randomBytes(24).toString("hex");
    const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`;

    const cookieStore = await cookies();
    cookieStore.set(STATE_COOKIE_NAME, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: STATE_MAX_AGE_SECONDS,
    });

    return Response.redirect(buildGoogleAuthUrl({ state, redirectUri }), 303);
  } catch (error) {
    return handleApiError(error);
  }
}

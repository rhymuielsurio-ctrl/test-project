import { AppError } from "@/lib/errors";

const GOOGLE_AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";

export interface GoogleUserInfo {
  email: string;
  name: string | null;
  emailVerified: boolean;
}

export function isGoogleAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function requireGoogleAuthConfigured(): void {
  if (!isGoogleAuthConfigured()) {
    throw new AppError("CONFIGURATION_ERROR", "Google sign-in is not configured", 500);
  }
}

export function buildGoogleAuthUrl(input: { state: string; redirectUri: string }): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    redirect_uri: input.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: input.state,
    prompt: "select_account",
  });
  return `${GOOGLE_AUTHORIZATION_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(input: {
  code: string;
  redirectUri: string;
}): Promise<{ accessToken: string }> {
  const body = new URLSearchParams({
    code: input.code,
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
    redirect_uri: input.redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const payload = (await response.json()) as {
    access_token?: string;
    error?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new AppError("UNAUTHORIZED", "Google authorization code could not be exchanged", 400);
  }
  return { accessToken: payload.access_token };
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const url = new URL(GOOGLE_TOKENINFO_URL);
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url);
  const payload = (await response.json()) as {
    email?: string;
    name?: string;
    email_verified?: string | boolean | number;
    error_description?: string;
  };

  if (!response.ok || !payload.email) {
    throw new AppError("UNAUTHORIZED", "Google user info could not be fetched", 400);
  }

  return {
    email: payload.email,
    name: payload.name ?? null,
    emailVerified: String(payload.email_verified ?? "") === "true",
  };
}

import { Card } from "@/components/ui/card";
import LoginForm from "@/components/features/login-form";
import { isGoogleAuthConfigured } from "@/lib/google-auth";

interface LoginPageProps {
  searchParams: Promise<{ error?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  const googleFailed = error === "google_sso_failed";
  const loginError = googleFailed
    ? "Google sign-in failed. Try again or use the email/password method."
    : null;

  return (
    <main className="bg-gradient-to-br from-primary/10 via-background to-background flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm">
        <LoginForm googleEnabled={isGoogleAuthConfigured()} loginError={loginError} />
      </Card>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BriefcaseBusiness, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";

interface LoginFormProps {
  googleEnabled: boolean;
  loginError: string | null;
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      role="alert"
    >
      {message}
    </div>
  );
}

export default function LoginForm({ googleEnabled, loginError }: LoginFormProps) {
  const router = useRouter();

  const [tab, setTab] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Login failed");
      }

      router.push("/leave-requests");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegisterError(null);

    if (registerPassword !== confirmPassword) {
      setRegisterError("Passwords do not match");
      return;
    }

    setRegisterLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: registerEmail,
          password: registerPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Registration failed");
      }

      router.push("/leave-requests");
      router.refresh();
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setRegisterLoading(false);
    }
  }

  return (
    <>
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <BriefcaseBusiness className="size-5" />
        </div>
        <Tabs value={tab} onValueChange={setTab} defaultValue="login">
          <TabsList className="w-full">
            <TabsTrigger value="login">Log in</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {googleEnabled && (
          <div className="mb-6 flex flex-col gap-4">
            <Button asChild variant="outline" className="w-full">
              <a href="/api/auth/google">
                <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.36c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.29 9.14 5.36 12 5.36z"
                  />
                </svg>
                Continue with Google
              </a>
            </Button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              or
              <div className="h-px flex-1 bg-border" />
            </div>
          </div>
        )}
        {loginError && (
          <div className="mb-4">
            <ErrorNotice message={loginError} />
          </div>
        )}
        {tab === "register" && (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <CardTitle className="text-lg text-left">Create your account</CardTitle>
              <CardDescription className="text-left">
                Join as an employee to manage your leave
              </CardDescription>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" />
                <Input
                  id="name"
                  className="pl-8"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Jane Doe"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="register-email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" />
                <Input
                  id="register-email"
                  type="email"
                  className="pl-8"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="register-password">Password</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" />
                <Input
                  id="register-password"
                  type="password"
                  className="pl-8"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  className="pl-8"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  required
                />
              </div>
            </div>
            {registerError && <ErrorNotice message={registerError} />}
            <Button type="submit" disabled={registerLoading} className="mt-2 w-full">
              {registerLoading && <Loader2 className="animate-spin" />}
              {registerLoading ? "Creating account..." : "Create account"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              You will be signed in automatically after registering.
            </p>
          </form>
        )}
        {tab === "login" && (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <CardTitle className="text-lg text-left">Welcome back</CardTitle>
              <CardDescription className="text-left">Sign in to manage your leave</CardDescription>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-8"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  className="pl-8"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            {error && <ErrorNotice message={error} />}
            <Button type="submit" disabled={loading} className="mt-2 w-full">
              {loading && <Loader2 className="animate-spin" />}
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="justify-center text-xs text-muted-foreground">
        Authenticated against the Postgres database.
      </CardFooter>
    </>
  );
}

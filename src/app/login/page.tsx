"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BriefcaseBusiness, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";

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

export default function LoginPage() {
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
    <main className="bg-gradient-to-br from-primary/10 via-background to-background flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm">
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
                <CardDescription className="text-left">
                  Sign in to manage your leave
                </CardDescription>
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
      </Card>
    </main>
  );
}

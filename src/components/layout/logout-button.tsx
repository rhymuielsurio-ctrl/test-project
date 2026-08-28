"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleLogout} disabled={loading}>
      {loading ? <Loader2 className="animate-spin" /> : <LogOut className="size-4" />}
      Log out
    </Button>
  );
}

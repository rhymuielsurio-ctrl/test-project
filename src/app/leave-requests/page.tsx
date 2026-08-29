"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/features/status-badge";
import { LeaveBalanceCard } from "@/components/features/leave-balance-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarPlus } from "lucide-react";
import Link from "next/link";
import type { MyLeaveRequest } from "@/lib/leave-store";

interface LeaveType {
  id: string;
  name: string;
  tracksBalance: boolean;
}

interface BalanceEntry {
  leaveType: LeaveType;
  confirmed: number;
  pendingDays: number;
  remaining: number;
}

interface BalanceData {
  requests: MyLeaveRequest[];
  balances: BalanceEntry[];
}

const requestedAtFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatRequestedAt(value: string): string {
  return requestedAtFormatter.format(new Date(value));
}

export default function LeaveBalancePage() {
  const [data, setData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      try {
        const res = await fetch("/api/leave-requests?scope=mine");
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error?.message ?? "Failed to load balance");
        }
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchBalance();
  }, []);

  if (loading) {
    return (
      <main className="px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">My Leave Balance</h1>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
        <div className="mt-8 h-48 animate-pulse rounded-lg border bg-muted" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">My Leave Balance</h1>
        <div
          className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">My Leave Balance</h1>
        <Button asChild size="sm">
          <Link href="/leave-requests/new">
            <CalendarPlus className="size-4" />
            New Request
          </Link>
        </Button>
      </div>

      {data && (
        <>
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">Available Balances</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.balances
                .filter((b) => b.leaveType.tracksBalance)
                .map((b) => (
                  <LeaveBalanceCard
                    key={b.leaveType.id}
                    leaveTypeName={b.leaveType.name}
                    confirmed={b.confirmed}
                    pendingDays={b.pendingDays}
                    remaining={b.remaining}
                  />
                ))}
            </div>
          </section>

          {data.requests.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">My Requests</h2>
              <div className="flex flex-col gap-3">
                {data.requests.map((r) => (
                  <Card key={r.id}>
                    <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {data.balances.find((b) => b.leaveType.id === r.leave_type_id)?.leaveType
                          .name ?? r.leave_type_id}
                      </CardTitle>
                      <StatusBadge status={r.status} />
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm tabular-nums">
                        {r.start_date} — {r.end_date}
                      </CardDescription>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Requested {formatRequestedAt(r.created_at)}
                      </p>
                      {r.reason && (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {r.reason}
                        </p>
                      )}
                      {r.status === "rejected" && r.rejection_reason && (
                        <p className="mt-2 text-sm leading-relaxed text-destructive">
                          Rejected: {r.rejection_reason}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/features/status-badge";
import { LeaveBalanceCard } from "@/components/features/leave-balance-card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarPlus } from "lucide-react";
import Link from "next/link";
import type { DbLeaveRequest } from "@/lib/mock-data";

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
  requests: DbLeaveRequest[];
  balances: BalanceEntry[];
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
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">My Leave Balance</h1>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
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
    <main className="mx-auto max-w-3xl px-4 py-8">
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
            <div className="space-y-3">
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
              <div className="overflow-hidden rounded-lg border bg-card">
                <Table aria-label="Leave requests">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.requests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          {data.balances.find((b) => b.leaveType.id === r.leave_type_id)?.leaveType
                            .name ?? r.leave_type_id}
                        </TableCell>
                        <TableCell className="whitespace-nowrap tabular-nums">
                          {r.start_date} — {r.end_date}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={r.status} />
                        </TableCell>
                        <TableCell className="max-w-40 truncate text-muted-foreground">
                          {r.reason}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

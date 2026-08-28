"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { LeaveBalanceCard } from "@/components/features/leave-balance-card";
import type { DbLeaveRequest } from "@/lib/mock-data";

function statusToVariant(status: DbLeaveRequest["status"]): "success" | "warning" | "error" {
  const map: Record<DbLeaveRequest["status"], "success" | "warning" | "error"> = {
    approved: "success",
    pending: "warning",
    rejected: "error",
  };
  return map[status];
}

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
        <h1 className="mb-6 text-xl font-bold text-slate-900">My Leave Balance</h1>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-slate-200 bg-slate-100"
            />
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-xl font-bold text-slate-900">My Leave Balance</h1>
        <div className="rounded-md bg-error-bg p-4 text-sm text-error-text">{error}</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold text-slate-900">My Leave Balance</h1>

      {data && (
        <>
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-medium text-slate-600">Available Balances</h2>
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
              <h2 className="mb-3 text-sm font-medium text-slate-600">My Requests</h2>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm" aria-label="Leave requests">
                  <thead className="bg-slate-50 text-xs text-slate-600">
                    <tr>
                      <th scope="col" className="px-3 py-2">
                        Type
                      </th>
                      <th scope="col" className="px-3 py-2">
                        Dates
                      </th>
                      <th scope="col" className="px-3 py-2">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-2">
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.requests.map((r) => (
                      <tr key={r.id} className="bg-white">
                        <td className="px-3 py-2">
                          {data.balances.find((b) => b.leaveType.id === r.leave_type_id)?.leaveType
                            .name ?? r.leave_type_id}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          {r.start_date} — {r.end_date}
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant={statusToVariant(r.status)}>{r.status}</Badge>
                        </td>
                        <td className="max-w-[120px] truncate px-3 py-2 text-slate-500">
                          {r.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

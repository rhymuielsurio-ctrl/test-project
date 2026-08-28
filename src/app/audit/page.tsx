"use client";

import { useCallback, useEffect, useState } from "react";
import { MOCK_USERS } from "@/lib/mock-data";
import { Select, type SelectOption } from "@/components/ui/select";
import { AuditHistoryTable, type AuditRequest } from "@/components/features/audit-history-table";

const userOptions: SelectOption[] = MOCK_USERS.map((u) => ({
  value: u.id,
  label: u.name,
}));

export default function AuditHistoryPage() {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [requests, setRequests] = useState<AuditRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAudit = useCallback(async (userId: string) => {
    if (!userId) {
      setRequests([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/audit/${userId}`);
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message ?? "Failed to load audit log");
      }
      setRequests(json.data.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAudit(selectedUserId);
  }, [selectedUserId, fetchAudit]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold text-slate-900">Employee Audit History</h1>
      <div className="mb-6 max-w-xs">
        <Select
          label="Select Employee"
          options={userOptions}
          placeholder="Choose an employee..."
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
        />
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border border-slate-200 bg-slate-100"
            />
          ))}
        </div>
      )}

      {error && <div className="rounded-md bg-error-bg p-4 text-sm text-error-text">{error}</div>}

      {!loading && !error && selectedUserId && <AuditHistoryTable requests={requests} />}

      {!loading && !error && !selectedUserId && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center" role="status">
          <p className="text-sm text-slate-500">Select an employee to view their audit history.</p>
        </div>
      )}
    </main>
  );
}

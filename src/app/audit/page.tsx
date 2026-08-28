"use client";

import { useCallback, useEffect, useState } from "react";
import { MOCK_USERS } from "@/lib/mock-data";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { AuditHistoryTable, type AuditRequest } from "@/components/features/audit-history-table";

const userOptions = MOCK_USERS.map((u) => ({ value: u.id, label: u.name }));

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
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Employee Audit History</h1>

      <div className="mb-6 grid max-w-xs gap-2">
        <Label htmlFor="employee-select">Select Employee</Label>
        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger id="employee-select" className="w-full">
            <SelectValue placeholder="Choose an employee..." />
          </SelectTrigger>
          <SelectContent>
            {userOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      )}

      {error && (
        <div
          className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      {!loading && !error && selectedUserId && <AuditHistoryTable requests={requests} />}

      {!loading && !error && !selectedUserId && (
        <Card className="flex flex-col items-center gap-2 p-10 text-center" role="status">
          <p className="text-sm text-muted-foreground">
            Select an employee to view their audit history.
          </p>
        </Card>
      )}
    </main>
  );
}

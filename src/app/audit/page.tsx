"use client";

import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardDescription } from "@/components/ui/card";
import { MOCK_USERS } from "@/lib/mock-data";
import {
  AuditActivityTimeline,
  type AuditRequest,
} from "@/components/features/audit-activity-timeline";

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

  const selectedUser = MOCK_USERS.find((u) => u.id === selectedUserId);

  return (
    <main className="px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Employee Audit History</h1>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start">
        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select Employee" />
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
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && selectedUserId && (
        <AuditActivityTimeline requests={requests} userName={selectedUser?.name} />
      )}

      {!loading && !error && !selectedUserId && (
        <Card className="items-center p-6">
          <CardDescription className="text-center">
            Select an employee to view their audit history.
          </CardDescription>
        </Card>
      )}
    </main>
  );
}

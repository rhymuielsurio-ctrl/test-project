"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ManagerQueueTable,
  type EnrichedLeaveRequest,
} from "@/components/features/manager-queue-table";
import { RejectionModal } from "@/components/features/rejection-modal";

export default function ManagerQueuePage() {
  const [requests, setRequests] = useState<EnrichedLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    requestId: string | null;
    employeeName: string;
  }>({ open: false, requestId: null, employeeName: "" });

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/leave-requests?scope=team");
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message ?? "Failed to load queue");
      }
      setRequests(json.data.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  async function handleApprove(requestId: string) {
    setProcessingId(requestId);
    try {
      const res = await fetch(`/api/leave-requests/${requestId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "approved" }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message ?? "Failed to approve request");
      }
      await fetchQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setProcessingId(null);
    }
  }

  function handleReject(requestId: string) {
    const request = requests.find((r) => r.id === requestId);
    setRejectModal({
      open: true,
      requestId,
      employeeName: request?.employeeName ?? "employee",
    });
  }

  async function handleRejectSubmit(reason: string) {
    const requestId = rejectModal.requestId;
    if (!requestId) return;

    setProcessingId(requestId);
    setRejectModal((prev) => ({ ...prev, open: false }));
    try {
      const res = await fetch(`/api/leave-requests/${requestId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "rejected", reason }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message ?? "Failed to reject request");
      }
      await fetchQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setProcessingId(null);
    }
  }

  function handleRejectClose() {
    setRejectModal({ open: false, requestId: null, employeeName: "" });
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-xl font-bold text-slate-900">Manager Approval Queue</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border border-slate-200 bg-slate-100"
            />
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-xl font-bold text-slate-900">Manager Approval Queue</h1>
        <div className="rounded-md bg-error-bg p-4 text-sm text-error-text">{error}</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold text-slate-900">Manager Approval Queue</h1>
      <ManagerQueueTable
        requests={requests}
        processingId={processingId}
        onApprove={handleApprove}
        onReject={handleReject}
      />
      {rejectModal.open && rejectModal.requestId && (
        <RejectionModal
          employeeName={rejectModal.employeeName}
          onSubmit={handleRejectSubmit}
          onClose={handleRejectClose}
          processing={processingId !== null}
        />
      )}
    </main>
  );
}

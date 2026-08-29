"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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
      toast.success("Request approved.");
      await fetchQueue();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      toast.error(message);
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
      toast.success("Request rejected.");
      await fetchQueue();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  }

  function handleRejectClose() {
    setRejectModal({ open: false, requestId: null, employeeName: "" });
  }

  if (loading) {
    return (
      <main className="px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Manager Approval Queue</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      </main>
    );
  }

  if (error && requests.length === 0) {
    return (
      <main className="px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Manager Approval Queue</h1>
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
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Manager Approval Queue</h1>
      <ManagerQueueTable
        requests={requests}
        processingId={processingId}
        onApprove={handleApprove}
        onReject={handleReject}
      />
      <RejectionModal
        open={rejectModal.open}
        employeeName={rejectModal.employeeName}
        onSubmit={handleRejectSubmit}
        onClose={handleRejectClose}
        processing={processingId !== null}
      />
    </main>
  );
}

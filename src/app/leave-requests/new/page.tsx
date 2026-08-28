"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LeaveRequestForm } from "@/components/features/leave-request-form";

export default function NewLeaveRequestPage() {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function handleSubmit(data: {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
  }) {
    const response = await fetch("/api/leave-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      const message = result.error?.message || "Failed to submit request";
      throw new Error(message);
    }

    timeoutRef.current = setTimeout(() => {
      router.push("/leave-requests");
    }, 1500);

    return result.data;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Submit Leave Request</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <LeaveRequestForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}

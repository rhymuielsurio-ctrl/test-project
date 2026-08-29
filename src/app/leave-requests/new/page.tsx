"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LeaveRequestForm } from "@/components/features/leave-request-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    }, 1200);

    return result.data;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Submit Leave Request</CardTitle>
        </CardHeader>
        <CardContent>
          <LeaveRequestForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  );
}

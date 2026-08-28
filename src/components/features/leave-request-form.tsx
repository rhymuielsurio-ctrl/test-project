"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MOCK_LEAVE_TYPES } from "@/lib/mock-data";

interface SubmitResult {
  request: { id: string };
  warning?: string;
}

interface LeaveRequestFormProps {
  onSubmit: (data: {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
  }) => Promise<SubmitResult>;
}

const leaveTypeOptions = MOCK_LEAVE_TYPES.map((lt) => ({
  value: lt.id,
  label: lt.name,
}));

export function LeaveRequestForm({ onSubmit }: LeaveRequestFormProps) {
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setWarning(null);
    setSubmitting(true);

    try {
      const result = await onSubmit({ leaveTypeId, startDate, endDate, reason });
      if (result.warning) {
        setWarning(result.warning);
      }
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Submission failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border border-success bg-success-bg p-6 text-center">
        <h3 className="text-lg font-semibold text-success-text">Request Submitted</h3>
        <p className="mt-2 text-sm text-success-text">
          Your leave request has been submitted and is pending manager approval.
        </p>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => {
            setSuccess(false);
            setLeaveTypeId("");
            setStartDate("");
            setEndDate("");
            setReason("");
            setWarning(null);
          }}
        >
          Submit Another Request
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Select
        label="Leave Type"
        options={leaveTypeOptions}
        placeholder="Select a leave type"
        value={leaveTypeId}
        onChange={(e) => setLeaveTypeId(e.target.value)}
        required
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
        <Input
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
        />
      </div>

      <Textarea
        label="Reason"
        rows={3}
        maxLength={500}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Brief reason for your leave request"
        required
      />
      <p className="text-xs text-slate-500">{reason.length}/500 characters</p>

      {error && (
        <div
          className="rounded-md border border-error bg-error-bg p-3 text-sm text-error-text"
          role="alert"
        >
          {error}
        </div>
      )}

      {warning && (
        <div
          className="rounded-md border border-warning bg-warning-bg p-3 text-sm text-warning-text"
          role="status"
        >
          {warning}
        </div>
      )}

      <Button type="submit" loading={submitting} className="w-full sm:w-auto">
        Submit Request
      </Button>
    </form>
  );
}

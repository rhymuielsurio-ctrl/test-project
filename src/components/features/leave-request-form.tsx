"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
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

function toDateInputValue(date: Date | undefined): string {
  return date ? format(date, "yyyy-MM-dd") : "";
}

export function LeaveRequestForm({ onSubmit }: LeaveRequestFormProps) {
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const endDate = dateRange?.to ?? dateRange?.from;
      if (!dateRange?.from || !endDate) {
        toast.error("Please pick the dates you want to take leave.");
        return;
      }
      const result = await onSubmit({
        leaveTypeId,
        startDate: toDateInputValue(dateRange.from),
        endDate: toDateInputValue(endDate),
        reason,
      });
      if (result.warning) {
        toast.warning(result.warning);
      } else {
        toast.success("Your leave request has been submitted.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Submission failed";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const fromDate = dateRange?.from;
  const toDate = dateRange?.to ?? fromDate;
  const hasRange = Boolean(fromDate);
  const rangeLabel = fromDate
    ? format(fromDate, "MMM d, yyyy") +
      (toDate && fromDate.getTime() !== toDate.getTime()
        ? ` — ${format(toDate, "MMM d, yyyy")}`
        : "")
    : "";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-2">
        <Label htmlFor="leave-type">Leave Type</Label>
        <Select value={leaveTypeId} onValueChange={setLeaveTypeId} required>
          <SelectTrigger id="leave-type" className="w-full">
            <SelectValue placeholder="Select a leave type" />
          </SelectTrigger>
          <SelectContent>
            {leaveTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="date-range">Requested Dates</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              id="date-range"
              className="justify-start gap-2 text-left font-normal"
            >
              <CalendarIcon className="size-4" />
              {hasRange ? rangeLabel : <span>Pick a date range</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="reason">Reason</Label>
          <span className="text-xs text-muted-foreground tabular-nums">{reason.length}/500</span>
        </div>
        <Textarea
          id="reason"
          rows={3}
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Brief reason for your leave request"
          required
        />
      </div>

      <div>
        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting && <Loader2 className="animate-spin" />}
          {submitting ? "Submitting..." : "Submit Request"}
        </Button>
      </div>
    </form>
  );
}

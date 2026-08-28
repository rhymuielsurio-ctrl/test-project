import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/features/status-badge";
import { Card } from "@/components/ui/card";
import { Loader2, ShieldCheck, ShieldX } from "lucide-react";

export interface EnrichedLeaveRequest {
  id: string;
  employeeName: string;
  leaveTypeName: string;
  start_date: string;
  end_date: string;
  totalDays: number;
  status: "pending" | "approved" | "rejected";
  reason: string;
}

interface ManagerQueueTableProps {
  requests: EnrichedLeaveRequest[];
  processingId: string | null;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

export function ManagerQueueTable({
  requests,
  processingId,
  onApprove,
  onReject,
}: ManagerQueueTableProps) {
  if (requests.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 p-10 text-center" role="status">
        <ShieldCheck className="size-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          No pending leave requests from your direct reports.
        </p>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table aria-label="Manager approval queue">
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Leave Type</TableHead>
            <TableHead>Requested Dates</TableHead>
            <TableHead className="text-right">Total Days</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((r) => {
            const isProcessing = processingId === r.id;
            return (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.employeeName}</TableCell>
                <TableCell className="whitespace-nowrap">{r.leaveTypeName}</TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {r.start_date} — {r.end_date}
                </TableCell>
                <TableCell className="text-right tabular-nums">{r.totalDays}</TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
                {r.status === "pending" && (
                  <TableCell>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        disabled={processingId !== null}
                        onClick={() => onApprove(r.id)}
                        aria-label={`Approve ${r.employeeName}'s request`}
                      >
                        {isProcessing ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <ShieldCheck className="size-4" />
                        )}
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-red-600 hover:bg-red-500/10 hover:text-red-700 sm:w-auto"
                        disabled={processingId !== null}
                        onClick={() => onReject(r.id)}
                        aria-label={`Reject ${r.employeeName}'s request`}
                      >
                        {isProcessing ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <ShieldX className="size-4" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

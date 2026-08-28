import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/features/status-badge";
import { MOCK_USERS, MOCK_LEAVE_TYPES } from "@/lib/mock-data";

export interface AuditEntry {
  id: string;
  leave_request_id: string;
  actor_id: string;
  action: string;
  occurred_at: string;
}

export interface AuditRequest {
  id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  auditEntries: AuditEntry[];
}

interface AuditHistoryTableProps {
  requests: AuditRequest[];
}

function resolveUserName(userId: string): string {
  return MOCK_USERS.find((u) => u.id === userId)?.name ?? "Unknown";
}

function resolveLeaveTypeName(typeId: string): string {
  return MOCK_LEAVE_TYPES.find((lt) => lt.id === typeId)?.name ?? "Unknown";
}

function sortByNewestFirst(requests: AuditRequest[]): AuditRequest[] {
  return [...requests].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function AuditHistoryTable({ requests }: AuditHistoryTableProps) {
  if (requests.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 p-10 text-center" role="status">
        <p className="text-sm text-muted-foreground">No audit records found for this employee.</p>
      </Card>
    );
  }

  const sorted = sortByNewestFirst(requests);

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table aria-label="Audit history">
        <TableHeader>
          <TableRow>
            <TableHead>Leave Type</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Decision Maker</TableHead>
            <TableHead>Decided At</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Occurred At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="whitespace-nowrap">
                {resolveLeaveTypeName(r.leave_type_id)}
              </TableCell>
              <TableCell className="whitespace-nowrap tabular-nums">
                {r.start_date} — {r.end_date}
              </TableCell>
              <TableCell>
                <StatusBadge status={r.status} />
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {r.decided_by ? resolveUserName(r.decided_by) : "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {r.decided_at ? new Date(r.decided_at).toLocaleDateString() : "—"}
              </TableCell>
              <TableCell>
                {r.auditEntries.length > 0 ? (
                  <ul className="space-y-1">
                    {r.auditEntries.map((a) => (
                      <li key={a.id} className="text-xs text-muted-foreground">
                        {a.action}
                      </li>
                    ))}
                  </ul>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {r.auditEntries.length > 0
                  ? new Date(
                      r.auditEntries[r.auditEntries.length - 1].occurred_at,
                    ).toLocaleDateString()
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

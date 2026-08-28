import { Badge } from "@/components/ui/badge";
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

function statusToVariant(status: AuditRequest["status"]): "success" | "warning" | "error" {
  const map: Record<AuditRequest["status"], "success" | "warning" | "error"> = {
    approved: "success",
    pending: "warning",
    rejected: "error",
  };
  return map[status];
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
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center" role="status">
        <p className="text-sm text-slate-500">No audit records found for this employee.</p>
      </div>
    );
  }

  const sorted = sortByNewestFirst(requests);

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-left text-sm" aria-label="Audit history">
        <thead className="bg-slate-50 text-xs text-slate-600">
          <tr>
            <th scope="col" className="px-3 py-2">
              Leave Type
            </th>
            <th scope="col" className="px-3 py-2">
              Dates
            </th>
            <th scope="col" className="px-3 py-2">
              Status
            </th>
            <th scope="col" className="px-3 py-2">
              Decision Maker
            </th>
            <th scope="col" className="px-3 py-2">
              Decided At
            </th>
            <th scope="col" className="px-3 py-2">
              Action
            </th>
            <th scope="col" className="px-3 py-2">
              Occurred At
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.map((r) => (
            <tr key={r.id} className="bg-white">
              <td className="whitespace-nowrap px-3 py-2">
                {resolveLeaveTypeName(r.leave_type_id)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {r.start_date} — {r.end_date}
              </td>
              <td className="px-3 py-2">
                <Badge variant={statusToVariant(r.status)}>{r.status}</Badge>
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {r.decided_by ? resolveUserName(r.decided_by) : "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                {r.decided_at ? new Date(r.decided_at).toLocaleDateString() : "—"}
              </td>
              <td className="px-3 py-2">
                {r.auditEntries.length > 0 ? (
                  <ul className="list-none space-y-1">
                    {r.auditEntries.map((a) => (
                      <li key={a.id} className="text-xs text-slate-600">
                        {a.action}
                      </li>
                    ))}
                  </ul>
                ) : (
                  "—"
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                {r.auditEntries.length > 0
                  ? new Date(
                      r.auditEntries[r.auditEntries.length - 1].occurred_at,
                    ).toLocaleDateString()
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

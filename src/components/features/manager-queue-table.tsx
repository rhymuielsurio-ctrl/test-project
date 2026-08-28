import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

function statusToVariant(status: EnrichedLeaveRequest["status"]): "success" | "warning" | "error" {
  const map: Record<EnrichedLeaveRequest["status"], "success" | "warning" | "error"> = {
    approved: "success",
    pending: "warning",
    rejected: "error",
  };
  return map[status];
}

export function ManagerQueueTable({
  requests,
  processingId,
  onApprove,
  onReject,
}: ManagerQueueTableProps) {
  if (requests.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center" role="status">
        <p className="text-sm text-slate-500">
          No pending leave requests from your direct reports.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-left text-sm" aria-label="Manager approval queue">
        <thead className="bg-slate-50 text-xs text-slate-600">
          <tr>
            <th scope="col" className="px-3 py-2">
              Employee
            </th>
            <th scope="col" className="px-3 py-2">
              Leave Type
            </th>
            <th scope="col" className="px-3 py-2">
              Requested Dates
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              Total Days
            </th>
            <th scope="col" className="px-3 py-2">
              Status
            </th>
            <th scope="col" className="px-3 py-2">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {requests.map((r) => (
            <tr key={r.id} className="bg-white">
              <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-900">
                {r.employeeName}
              </td>
              <td className="whitespace-nowrap px-3 py-2">{r.leaveTypeName}</td>
              <td className="whitespace-nowrap px-3 py-2">
                {r.start_date} — {r.end_date}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right">{r.totalDays}</td>
              <td className="px-3 py-2">
                <Badge variant={statusToVariant(r.status)}>{r.status}</Badge>
              </td>
              {r.status === "pending" && (
                <td className="whitespace-nowrap px-3 py-2">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full sm:w-auto"
                      loading={processingId === r.id}
                      disabled={processingId !== null}
                      onClick={() => onApprove(r.id)}
                      aria-label={`Approve ${r.employeeName}'s request`}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="w-full sm:w-auto"
                      loading={processingId === r.id}
                      disabled={processingId !== null}
                      onClick={() => onReject(r.id)}
                      aria-label={`Reject ${r.employeeName}'s request`}
                    >
                      Reject
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

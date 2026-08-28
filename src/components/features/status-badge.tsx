import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type RequestStatus = "pending" | "approved" | "rejected";

const statusStyles: Record<RequestStatus, string> = {
  approved: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  pending: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  rejected: "bg-red-500/10 text-red-700 dark:bg-red-500/15 dark:text-red-400",
};

export function StatusBadge({ status, className }: { status: RequestStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn(statusStyles[status], className)}>
      {status}
    </Badge>
  );
}

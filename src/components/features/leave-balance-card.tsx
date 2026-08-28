import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface LeaveBalanceCardProps {
  leaveTypeName: string;
  confirmed: number;
  pendingDays: number;
  remaining: number;
}

export function LeaveBalanceCard({
  leaveTypeName,
  confirmed,
  pendingDays,
  remaining,
}: LeaveBalanceCardProps) {
  return (
    <Card aria-label={`${leaveTypeName} balance`}>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">{leaveTypeName}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-x-10 gap-y-4">
        <Stat label="Confirmed" value={confirmed} color="text-emerald-600" />
        <Stat label="Pending" value={pendingDays} color="text-amber-600" />
        <Stat label="Remaining" value={remaining} color="text-primary" />
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

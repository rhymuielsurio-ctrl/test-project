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
    <Card aria-label={`${leaveTypeName} balance`} className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{leaveTypeName}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 divide-x divide-border">
        <Stat label="Confirmed" value={confirmed} color="text-emerald-600" />
        <Stat label="Pending" value={pendingDays} color="text-amber-600" />
        <Stat label="Remaining" value={remaining} color="text-primary" />
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-1 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

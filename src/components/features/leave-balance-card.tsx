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
    <div
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      role="region"
      aria-label={`${leaveTypeName} balance`}
    >
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{leaveTypeName}</h3>
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
        <Stat label="Confirmed" value={confirmed} color="text-success-text" />
        <Stat label="Pending" value={pendingDays} color="text-warning-text" />
        <Stat label="Remaining" value={remaining} color="text-primary" />
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

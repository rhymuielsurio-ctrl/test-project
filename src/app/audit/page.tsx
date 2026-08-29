import { redirect } from "next/navigation";
import { getMockSession } from "@/lib/auth";
import { listUsersForAudit } from "@/lib/leave-store";
import { AuditHistoryView, type AuditUserOption } from "@/components/features/audit-history-view";

export const dynamic = "force-dynamic";

export default async function AuditHistoryPage() {
  const session = await getMockSession();
  if (session?.role !== "hr_admin") {
    redirect("/leave-requests");
  }

  let users: AuditUserOption[] = [];
  try {
    const roster = await listUsersForAudit();
    users = roster.map((user) => ({ id: user.id, name: user.name }));
  } catch {
    users = [];
  }

  return <AuditHistoryView users={users} />;
}

import { redirect } from "next/navigation";
import { getMockSession } from "@/lib/auth";
import { listEmployeesForManagement } from "@/lib/leave-store";
import { EmployeeManagerTable } from "@/components/features/employee-manager-table";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const session = await getMockSession();
  if (session?.role !== "hr_admin") {
    redirect("/leave-requests");
  }

  let employees: Awaited<ReturnType<typeof listEmployeesForManagement>> = [];
  try {
    employees = await listEmployeesForManagement();
  } catch {
    employees = [];
  }

  return (
    <main className="px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Team &amp; Managers</h1>
      <EmployeeManagerTable employees={employees} />
    </main>
  );
}

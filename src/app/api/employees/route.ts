import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { listEmployeesForManagement } from "@/lib/leave-store";

export async function GET() {
  try {
    await requireAuth(["hr_admin"]);

    const employees = await listEmployeesForManagement();

    return Response.json({ success: true, data: { employees } }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

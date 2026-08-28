import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/errors";
import { MOCK_LEAVE_REQUESTS, MOCK_AUDIT_LOG, findUserById } from "@/lib/mock-data";
import { loadMockState } from "@/lib/mock-state";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    await requireAuth(["hr_admin"]);
    await loadMockState();
    const { userId } = await params;

    const user = findUserById(userId);
    if (!user) {
      throw new AppError("NOT_FOUND", "User not found", 404);
    }

    const requests = MOCK_LEAVE_REQUESTS.filter((r) => r.user_id === userId && !r.is_deleted).map(
      (r) => ({
        id: r.id,
        leave_type_id: r.leave_type_id,
        start_date: r.start_date,
        end_date: r.end_date,
        reason: r.reason,
        status: r.status,
        decided_by: r.decided_by,
        decided_at: r.decided_at,
        created_at: r.created_at,
        auditEntries: MOCK_AUDIT_LOG.filter((a) => a.leave_request_id === r.id),
      }),
    );

    return Response.json({ success: true, data: { requests } }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

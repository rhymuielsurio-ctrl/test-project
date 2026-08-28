import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/errors";
import { listAuditReport, userExists } from "@/lib/leave-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    await requireAuth(["hr_admin"]);
    const { userId } = await params;

    const exists = await userExists(userId);
    if (!exists) {
      throw new AppError("NOT_FOUND", "User not found", 404);
    }

    const requests = await listAuditReport(userId);

    return Response.json({ success: true, data: { requests } }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

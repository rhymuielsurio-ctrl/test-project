import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/errors";
import { decideLeaveRequest } from "@/lib/leave-store";

interface DecisionBody {
  decision: "approved" | "rejected";
  reason?: string;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["manager"]);
    const { id } = await params;

    let body: DecisionBody;
    try {
      body = await request.json();
    } catch {
      throw new AppError("VALIDATION_ERROR", "Invalid JSON body");
    }

    if (body.decision !== "approved" && body.decision !== "rejected") {
      throw new AppError("VALIDATION_ERROR", "decision must be 'approved' or 'rejected'");
    }

    if (body.decision === "rejected" && !body.reason?.trim()) {
      throw new AppError("VALIDATION_ERROR", "reason is required when rejecting");
    }

    const updatedRequest = await decideLeaveRequest({
      requestId: id,
      actorId: session.userId,
      decision: body.decision,
    });

    return Response.json({ success: true, data: { request: updatedRequest } }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

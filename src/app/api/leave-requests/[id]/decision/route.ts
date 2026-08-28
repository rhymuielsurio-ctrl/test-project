import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/errors";
import {
  MOCK_USERS,
  MOCK_LEAVE_REQUESTS,
  MOCK_BALANCES,
  addAuditEntry,
  generateAuditId,
  calculateBusinessDays,
  findLeaveTypeById,
} from "@/lib/mock-data";
import { loadMockState, saveMockState } from "@/lib/mock-state";

interface DecisionBody {
  decision: "approved" | "rejected";
  reason?: string;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["manager"]);
    const { id } = await params;
    await loadMockState();

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

    const leaveRequest = MOCK_LEAVE_REQUESTS.find((r) => r.id === id);
    if (!leaveRequest) {
      throw new AppError("NOT_FOUND", "Leave request not found", 404);
    }

    if (leaveRequest.status !== "pending") {
      throw new AppError("VALIDATION_ERROR", "Request has already been decided");
    }

    const requestUser = MOCK_USERS.find((u) => u.id === leaveRequest.user_id);
    if (!requestUser || requestUser.manager_id !== session.userId) {
      throw new AppError("FORBIDDEN", "You can only act on your direct reports' requests", 403);
    }

    const now = new Date().toISOString();

    if (body.decision === "approved") {
      const leaveType = findLeaveTypeById(leaveRequest.leave_type_id);
      const balance = MOCK_BALANCES.find(
        (b) => b.user_id === leaveRequest.user_id && b.leave_type_id === leaveRequest.leave_type_id,
      );
      if (!balance && leaveType?.tracks_balance) {
        throw new AppError(
          "BALANCE_NOT_FOUND",
          "No leave balance record exists for this request; cannot approve without deducting",
          400,
        );
      }
      if (balance) {
        const days = calculateBusinessDays(leaveRequest.start_date, leaveRequest.end_date);
        if (balance.balance < days) {
          throw new AppError(
            "INSUFFICIENT_BALANCE",
            `Insufficient balance: ${balance.balance} available, ${days} requested`,
            400,
          );
        }
        balance.balance -= days;
        balance.updated_at = now;
      }
    }

    leaveRequest.status = body.decision;
    leaveRequest.decided_by = session.userId;
    leaveRequest.decided_at = now;

    addAuditEntry({
      id: generateAuditId(),
      leave_request_id: leaveRequest.id,
      actor_id: session.userId,
      action: body.decision,
      occurred_at: now,
    });

    await saveMockState();

    return Response.json({ success: true, data: { request: leaveRequest } }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

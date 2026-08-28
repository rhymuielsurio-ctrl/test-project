import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/errors";
import {
  MOCK_USERS,
  MOCK_LEAVE_TYPES,
  MOCK_LEAVE_REQUESTS,
  findLeaveTypeById,
  findUserById,
  getBalanceForUser,
  addLeaveRequest,
  addAuditEntry,
  generateRequestId,
  generateAuditId,
  calculateBusinessDays,
  type DbLeaveRequest,
} from "@/lib/mock-data";
import { validateLeaveRequest, type LeaveRequestInput } from "@/lib/validators";
import { loadMockState, saveMockState } from "@/lib/mock-state";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(["employee"]);
    await loadMockState();

    let body: LeaveRequestInput;
    try {
      body = await request.json();
    } catch {
      throw new AppError("VALIDATION_ERROR", "Invalid JSON body");
    }

    const validation = validateLeaveRequest(body);
    if (!validation.valid) {
      return handleApiError(validation.error);
    }

    const { data } = validation;
    const leaveType = findLeaveTypeById(data.leaveTypeId);

    let warning: string | undefined;
    if (leaveType?.tracks_balance) {
      const balance = getBalanceForUser(session.userId, data.leaveTypeId);
      if (data.requestedDays > balance.remaining) {
        warning =
          `Requested ${data.requestedDays} days exceeds remaining balance of ${balance.remaining} days. ` +
          "Submitting for HR override.";
      }
    }

    const now = new Date().toISOString();
    const newRequest: DbLeaveRequest = {
      id: generateRequestId(),
      user_id: session.userId,
      leave_type_id: data.leaveTypeId,
      start_date: data.startDate,
      end_date: data.endDate,
      reason: data.reason,
      status: "pending",
      decided_by: null,
      decided_at: null,
      is_deleted: false,
      created_at: now,
    };

    addLeaveRequest(newRequest);

    await saveMockState();

    addAuditEntry({
      id: generateAuditId(),
      leave_request_id: newRequest.id,
      actor_id: session.userId,
      action: "submitted",
      occurred_at: now,
    });

    return Response.json(
      {
        success: true,
        data: {
          request: newRequest,
          ...(warning ? { warning } : {}),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(["employee", "manager", "hr_admin"]);
    await loadMockState();
    const scope = request.nextUrl.searchParams.get("scope");

    if (scope === "mine") {
      const userRequests = MOCK_LEAVE_REQUESTS.filter(
        (r) => r.user_id === session.userId && !r.is_deleted,
      );

      const balances = MOCK_LEAVE_TYPES.map((lt) => {
        const info = getBalanceForUser(session.userId, lt.id);
        return {
          leaveType: { id: lt.id, name: lt.name, tracksBalance: lt.tracks_balance },
          confirmed: info.confirmed,
          pendingDays: info.pendingDays,
          remaining: info.remaining,
        };
      });

      return Response.json(
        { success: true, data: { requests: userRequests, balances } },
        { status: 200 },
      );
    }

    if (scope === "team") {
      if (session.role !== "manager") {
        throw new AppError("FORBIDDEN", "Only managers can view team scope", 403);
      }

      const directReportIds = MOCK_USERS.filter((u) => u.manager_id === session.userId).map(
        (u) => u.id,
      );

      const teamRequests = MOCK_LEAVE_REQUESTS.filter(
        (r) => directReportIds.includes(r.user_id) && !r.is_deleted && r.status === "pending",
      ).map((r) => {
        const user = findUserById(r.user_id);
        const leaveType = findLeaveTypeById(r.leave_type_id);
        return {
          ...r,
          employeeName: user?.name ?? "Unknown",
          leaveTypeName: leaveType?.name ?? "Unknown",
          totalDays: calculateBusinessDays(r.start_date, r.end_date),
        };
      });

      return Response.json({ success: true, data: { requests: teamRequests } }, { status: 200 });
    }

    throw new AppError(
      "VALIDATION_ERROR",
      "Invalid or missing scope. Use ?scope=mine or ?scope=team.",
    );
  } catch (error) {
    return handleApiError(error);
  }
}

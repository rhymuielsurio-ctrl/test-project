import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/errors";
import { findLeaveTypeById } from "@/lib/mock-data";
import {
  createLeaveRequest,
  getBalanceInfo,
  insertAuditLog,
  listLeaveTypes,
  listRequestsForUser,
  listTeamPendingRequests,
} from "@/lib/leave-store";
import { validateLeaveRequest, type LeaveRequestInput } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(["employee"]);

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
      const balance = await getBalanceInfo(session.userId, data.leaveTypeId);
      if (data.requestedDays > balance.remaining) {
        warning =
          `Requested ${data.requestedDays} days exceeds remaining balance of ${balance.remaining} days. ` +
          "Submitting for HR override.";
      }
    }

    const createdRequest = await createLeaveRequest({
      userId: session.userId,
      wireLeaveTypeId: data.leaveTypeId,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
    });

    await insertAuditLog({
      leaveRequestId: createdRequest.id,
      actorId: session.userId,
      action: "submitted",
    });

    return Response.json(
      {
        success: true,
        data: {
          request: createdRequest,
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
    const scope = request.nextUrl.searchParams.get("scope");

    if (scope === "mine") {
      const userRequests = await listRequestsForUser(session.userId);

      const types = await listLeaveTypes();
      const balances = await Promise.all(
        types.map(async (lt) => {
          const wireId = `lt-${lt.code}`;
          const info = await getBalanceInfo(session.userId, wireId);
          return {
            leaveType: { id: wireId, name: lt.name, tracksBalance: lt.tracks_balance },
            confirmed: info.confirmed,
            pendingDays: info.pendingDays,
            remaining: info.remaining,
          };
        }),
      );

      return Response.json(
        { success: true, data: { requests: userRequests, balances } },
        { status: 200 },
      );
    }

    if (scope === "team") {
      if (session.role !== "manager") {
        throw new AppError("FORBIDDEN", "Only managers can view team scope", 403);
      }

      const teamRequests = await listTeamPendingRequests(session.userId);

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

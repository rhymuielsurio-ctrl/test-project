import { AppError } from "./errors";
import { findLeaveTypeById, calculateBusinessDays } from "./mock-data";

export interface LeaveRequestInput {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface ValidatedLeaveRequest {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  requestedDays: number;
}

const MAX_REASON_LENGTH = 500;

export function validateLeaveRequest(
  input: LeaveRequestInput,
): { valid: true; data: ValidatedLeaveRequest } | { valid: false; error: AppError } {
  if (!input.leaveTypeId || input.leaveTypeId.trim() === "") {
    return {
      valid: false,
      error: new AppError("VALIDATION_ERROR", "Leave type is required"),
    };
  }

  const leaveType = findLeaveTypeById(input.leaveTypeId);
  if (!leaveType) {
    return {
      valid: false,
      error: new AppError("VALIDATION_ERROR", "Invalid leave type"),
    };
  }

  if (!input.startDate) {
    return {
      valid: false,
      error: new AppError("VALIDATION_ERROR", "Start date is required"),
    };
  }

  if (!input.endDate) {
    return {
      valid: false,
      error: new AppError("VALIDATION_ERROR", "End date is required"),
    };
  }

  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);

  if (isNaN(startDate.getTime())) {
    return {
      valid: false,
      error: new AppError("VALIDATION_ERROR", "Invalid start date"),
    };
  }

  if (isNaN(endDate.getTime())) {
    return {
      valid: false,
      error: new AppError("VALIDATION_ERROR", "Invalid end date"),
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (startDate < today) {
    return {
      valid: false,
      error: new AppError("VALIDATION_ERROR", "Start date cannot be in the past"),
    };
  }

  if (endDate < startDate) {
    return {
      valid: false,
      error: new AppError("VALIDATION_ERROR", "End date cannot be before start date"),
    };
  }

  if (!input.reason || input.reason.trim() === "") {
    return {
      valid: false,
      error: new AppError("VALIDATION_ERROR", "Reason is required"),
    };
  }

  if (input.reason.length > MAX_REASON_LENGTH) {
    return {
      valid: false,
      error: new AppError(
        "VALIDATION_ERROR",
        `Reason must be ${MAX_REASON_LENGTH} characters or less`,
      ),
    };
  }

  const requestedDays = calculateBusinessDays(input.startDate, input.endDate);

  return {
    valid: true,
    data: {
      leaveTypeId: input.leaveTypeId,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason.trim(),
      requestedDays,
    },
  };
}

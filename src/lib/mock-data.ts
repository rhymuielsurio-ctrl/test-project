import type { UserRole } from "./auth";

export interface DbUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  manager_id: string | null;
}

export interface DbLeaveType {
  id: string;
  name: string;
  tracks_balance: boolean;
}

export interface DbLeaveRequest {
  id: string;
  user_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  decided_by: string | null;
  decided_at: string | null;
  is_deleted: boolean;
  created_at: string;
}

export interface DbAuditLog {
  id: string;
  leave_request_id: string;
  actor_id: string;
  action: string;
  details: string | null;
  occurred_at: string;
}

export interface BalanceInfo {
  confirmed: number;
  pendingDays: number;
  remaining: number;
}

/**
 * Static dev roster (uuid 0000...0001..0004), mirroring the users seeded by
 * supabase/migrations/002_auth_users.sql. The audit page now queries the
 * live users table (listUsersForAudit) instead of this array; it remains
 * exported for participating dev-only consumers (e.g. findUserById).
 */
export const MOCK_USERS: DbUser[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Alice Chen",
    email: "alice@example.com",
    role: "employee",
    manager_id: "00000000-0000-0000-0000-000000000002",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Bob Manager",
    email: "bob@example.com",
    role: "manager",
    manager_id: null,
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    name: "Carol Admin",
    email: "carol@example.com",
    role: "hr_admin",
    manager_id: null,
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    name: "Dave Employee",
    email: "dave@example.com",
    role: "employee",
    manager_id: "00000000-0000-0000-0000-000000000002",
  },
];

/**
 * Static leave-type catalog keyed by the app's wire ids ('lt-vacation' etc.).
 * Mirrors the codes seeded by supabase/migrations/003_leave_data.sql; the
 * underlying uuids live in Postgres. Wire id <-> code: 'lt-' + code.
 */
export const MOCK_LEAVE_TYPES: DbLeaveType[] = [
  { id: "lt-vacation", name: "Vacation", tracks_balance: true },
  { id: "lt-sick", name: "Sick", tracks_balance: true },
  { id: "lt-unpaid", name: "Unpaid", tracks_balance: false },
];

export function calculateBusinessDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export function findUserById(userId: string): DbUser | undefined {
  return MOCK_USERS.find((u) => u.id === userId);
}

export function findLeaveTypeById(leaveTypeId: string): DbLeaveType | undefined {
  return MOCK_LEAVE_TYPES.find((lt) => lt.id === leaveTypeId);
}

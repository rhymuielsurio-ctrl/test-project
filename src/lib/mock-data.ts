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

export interface DbLeavePolicy {
  id: string;
  user_id: string;
  leave_type_id: string;
  accrual_per_month: number;
}

export interface DbLeaveBalance {
  id: string;
  user_id: string;
  leave_type_id: string;
  balance: number;
  updated_at: string;
  accrued_at: string | null;
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
  occurred_at: string;
}

export interface BalanceInfo {
  confirmed: number;
  pendingDays: number;
  remaining: number;
}

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

export const MOCK_LEAVE_TYPES: DbLeaveType[] = [
  { id: "lt-vacation", name: "Vacation", tracks_balance: true },
  { id: "lt-sick", name: "Sick", tracks_balance: true },
  { id: "lt-unpaid", name: "Unpaid", tracks_balance: false },
];

export const MOCK_LEAVE_POLICIES: DbLeavePolicy[] = [
  {
    id: "lp-001",
    user_id: "00000000-0000-0000-0000-000000000001",
    leave_type_id: "lt-vacation",
    accrual_per_month: 1.25,
  },
  {
    id: "lp-002",
    user_id: "00000000-0000-0000-0000-000000000001",
    leave_type_id: "lt-sick",
    accrual_per_month: 1.0,
  },
  {
    id: "lp-003",
    user_id: "00000000-0000-0000-0000-000000000004",
    leave_type_id: "lt-vacation",
    accrual_per_month: 1.25,
  },
  {
    id: "lp-004",
    user_id: "00000000-0000-0000-0000-000000000004",
    leave_type_id: "lt-sick",
    accrual_per_month: 1.0,
  },
];

export const MOCK_BALANCES: DbLeaveBalance[] = [
  {
    id: "lb-001",
    user_id: "00000000-0000-0000-0000-000000000001",
    leave_type_id: "lt-vacation",
    balance: 10.0,
    updated_at: "2026-08-01T00:00:00Z",
    accrued_at: null,
  },
  {
    id: "lb-002",
    user_id: "00000000-0000-0000-0000-000000000001",
    leave_type_id: "lt-sick",
    balance: 8.0,
    updated_at: "2026-08-01T00:00:00Z",
    accrued_at: null,
  },
  {
    id: "lb-003",
    user_id: "00000000-0000-0000-0000-000000000004",
    leave_type_id: "lt-vacation",
    balance: 5.0,
    updated_at: "2026-08-01T00:00:00Z",
    accrued_at: null,
  },
  {
    id: "lb-004",
    user_id: "00000000-0000-0000-0000-000000000004",
    leave_type_id: "lt-sick",
    balance: 12.0,
    updated_at: "2026-08-01T00:00:00Z",
    accrued_at: null,
  },
];

export const MOCK_LEAVE_REQUESTS: DbLeaveRequest[] = [];

export const MOCK_AUDIT_LOG: DbAuditLog[] = [];

function maxNumericSuffix(ids: string[], prefix: string): number {
  return ids.reduce((max, id) => {
    if (!id.startsWith(prefix)) return max;
    const num = Number(id.slice(prefix.length));
    return Number.isFinite(num) ? Math.max(max, num) : max;
  }, 0);
}

export function generateRequestId(): string {
  const next =
    maxNumericSuffix(
      MOCK_LEAVE_REQUESTS.map((r) => r.id),
      "lr-",
    ) + 1;
  return `lr-${String(next).padStart(3, "0")}`;
}

export function generateAuditId(): string {
  const next =
    maxNumericSuffix(
      MOCK_AUDIT_LOG.map((a) => a.id),
      "al-",
    ) + 1;
  return `al-${String(next).padStart(3, "0")}`;
}

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

export function getBalanceForUser(userId: string, leaveTypeId: string): BalanceInfo {
  const balance = MOCK_BALANCES.find(
    (b) => b.user_id === userId && b.leave_type_id === leaveTypeId,
  );
  const confirmed = balance?.balance ?? 0;

  const pendingDays = MOCK_LEAVE_REQUESTS.filter(
    (r) =>
      r.user_id === userId &&
      r.leave_type_id === leaveTypeId &&
      r.status === "pending" &&
      !r.is_deleted,
  ).reduce((sum, r) => sum + calculateBusinessDays(r.start_date, r.end_date), 0);

  return {
    confirmed,
    pendingDays,
    remaining: confirmed - pendingDays,
  };
}

export function addLeaveRequest(request: DbLeaveRequest): DbLeaveRequest {
  MOCK_LEAVE_REQUESTS.push(request);
  return request;
}

export function addAuditEntry(entry: DbAuditLog): DbAuditLog {
  MOCK_AUDIT_LOG.push(entry);
  return entry;
}

export function findUserById(userId: string): DbUser | undefined {
  return MOCK_USERS.find((u) => u.id === userId);
}

export function findLeaveTypeById(leaveTypeId: string): DbLeaveType | undefined {
  return MOCK_LEAVE_TYPES.find((lt) => lt.id === leaveTypeId);
}

export function accrueAllBalances(): void {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  for (const policy of MOCK_LEAVE_POLICIES) {
    const balance = MOCK_BALANCES.find(
      (b) => b.user_id === policy.user_id && b.leave_type_id === policy.leave_type_id,
    );
    if (!balance) continue;

    const lastAccruedMonth = balance.accrued_at ? balance.accrued_at.slice(0, 7) : null;

    if (lastAccruedMonth !== currentMonth) {
      balance.balance += policy.accrual_per_month;
      balance.accrued_at = now.toISOString();
    }
  }
}

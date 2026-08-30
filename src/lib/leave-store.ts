import { getPool } from "@/lib/db";
import type { Pool } from "pg";
import { AppError } from "@/lib/errors";
import type { UserRole } from "@/lib/auth";
import {
  calculateBusinessDays,
  type BalanceInfo,
  type DbAuditLog,
  type DbLeaveRequest,
} from "@/lib/mock-data";

export interface LeaveTypeRow {
  id: string;
  code: string;
  name: string;
  tracks_balance: boolean;
}

export interface EnrichedLeaveRequest extends DbLeaveRequest {
  employeeName: string;
  leaveTypeName: string;
  totalDays: number;
}

export interface MyLeaveRequest extends DbLeaveRequest {
  rejection_reason: string | null;
}

export interface AuditReportRequest {
  id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  auditEntries: DbAuditLog[];
}

function toWireLeaveTypeId(code: string): string {
  return `lt-${code}`;
}

function toWireLeaveRequest(row: {
  id: string;
  user_id: string;
  leave_type_code: string;
  start_date: string | Date;
  end_date: string | Date;
  reason: string;
  status: string;
  decided_by: string | null;
  decided_at: Date | string | null;
  is_deleted: boolean;
  created_at: Date | string;
}): DbLeaveRequest {
  return {
    id: row.id,
    user_id: row.user_id,
    leave_type_id: toWireLeaveTypeId(row.leave_type_code),
    start_date: row.start_date instanceof Date ? row.start_date.toISOString() : row.start_date,
    end_date: row.end_date instanceof Date ? row.end_date.toISOString() : row.end_date,
    reason: row.reason,
    status: row.status as DbLeaveRequest["status"],
    decided_by: row.decided_by,
    decided_at: row.decided_at instanceof Date ? row.decided_at.toISOString() : row.decided_at,
    is_deleted: row.is_deleted,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

export async function listLeaveTypes(): Promise<LeaveTypeRow[]> {
  const { rows } = await getPool().query<LeaveTypeRow>(
    `SELECT id, code, name, tracks_balance
       FROM leave_types
      ORDER BY CASE code WHEN 'vacation' THEN 1 WHEN 'sick' THEN 2 ELSE 3 END, code`,
  );
  return rows;
}

export async function userExists(userId: string): Promise<boolean> {
  const { rows } = await getPool().query<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM users WHERE id = $1) AS exists`,
    [userId],
  );
  return rows[0]?.exists ?? false;
}

export async function getBalanceInfo(
  userId: string,
  wireLeaveTypeId: string,
): Promise<BalanceInfo> {
  const code = wireLeaveTypeId.replace(/^lt-/, "");
  const balance = await getPool().query<{ confirmed: number }>(
    `SELECT COALESCE(b.balance, 0)::float8 AS confirmed
       FROM leave_balances b
       JOIN leave_types lt ON lt.id = b.leave_type_id
      WHERE b.user_id = $1 AND lt.code = $2`,
    [userId, code],
  );
  const confirmed = balance.rows[0]?.confirmed ?? 0;

  const pending = await getPool().query<{ start_date: string; end_date: string }>(
    `SELECT r.start_date::text AS start_date, r.end_date::text AS end_date
       FROM leave_requests r
       JOIN leave_types lt ON lt.id = r.leave_type_id
      WHERE r.user_id = $1
        AND lt.code = $2
        AND r.status = 'pending'
        AND NOT r.is_deleted`,
    [userId, code],
  );
  const pendingDays = pending.rows.reduce(
    (sum, row) => sum + calculateBusinessDays(row.start_date, row.end_date),
    0,
  );

  return {
    confirmed,
    pendingDays,
    remaining: confirmed - pendingDays,
  };
}

export async function createLeaveRequest(input: {
  userId: string;
  wireLeaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  actorId: string;
}): Promise<DbLeaveRequest> {
  const code = input.wireLeaveTypeId.replace(/^lt-/, "");
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");

    const type = await client.query<LeaveTypeRow>(
      `SELECT id, code, name, tracks_balance FROM leave_types WHERE code = $1`,
      [code],
    );
    if (!type.rows[0]) {
      throw new AppError("VALIDATION_ERROR", "Invalid leave type");
    }

    const created = await client.query<{
      id: string;
      user_id: string;
      start_date: string;
      end_date: string;
      reason: string;
      status: string;
      created_at: Date;
    }>(
      `INSERT INTO leave_requests (user_id, leave_type_id, start_date, end_date, reason)
       VALUES ($1, $2, $3::date, $4::date, $5)
       RETURNING id, user_id, start_date::text AS start_date, end_date::text AS end_date,
                 reason, status, created_at`,
      [input.userId, type.rows[0].id, input.startDate, input.endDate, input.reason],
    );

    await client.query(
      `INSERT INTO audit_log (leave_request_id, actor_id, action)
       VALUES ($1, $2, 'submitted')`,
      [created.rows[0].id, input.actorId],
    );

    await client.query("COMMIT");

    const row = created.rows[0];
    return toWireLeaveRequest({
      ...row,
      leave_type_code: code,
      decided_by: null,
      decided_at: null,
      is_deleted: false,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export interface SplitRange {
  start: string;
  end: string;
}

export interface SplitLeaveResult {
  paid: SplitRange | null;
  unpaid: SplitRange | null;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function dateOnly(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function nextBusinessDay(date: Date): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  while (isWeekend(next)) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

function nthBusinessDay(start: Date, n: number): Date {
  const current = new Date(start);
  let seen = 0;
  while (seen < n) {
    if (!isWeekend(current)) seen++;
    if (seen < n) current.setDate(current.getDate() + 1);
  }
  return current;
}

export function splitLeaveRange(input: {
  startDate: string;
  endDate: string;
  remaining: number;
}): SplitLeaveResult {
  const paidDays = Math.floor(Math.max(0, input.remaining));
  const requestedDays = calculateBusinessDays(input.startDate, input.endDate);

  if (requestedDays <= paidDays) {
    return { paid: null, unpaid: null };
  }
  if (paidDays === 0) {
    return { paid: null, unpaid: { start: input.startDate, end: input.endDate } };
  }

  const paidEnd = nthBusinessDay(new Date(input.startDate), paidDays);
  const unpaidStart = nextBusinessDay(paidEnd);

  return {
    paid: { start: input.startDate, end: dateOnly(paidEnd) },
    unpaid: { start: dateOnly(unpaidStart), end: input.endDate },
  };
}

export interface CreateSplitResult {
  requests: DbLeaveRequest[];
  split: boolean;
}

export async function createLeaveRequestWithSplit(input: {
  userId: string;
  wireLeaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  actorId: string;
}): Promise<CreateSplitResult> {
  const code = input.wireLeaveTypeId.replace(/^lt-/, "");
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");

    const type = await client.query<LeaveTypeRow>(
      `SELECT id, code, name, tracks_balance FROM leave_types WHERE code = $1`,
      [code],
    );
    if (!type.rows[0]) {
      throw new AppError("VALIDATION_ERROR", "Invalid leave type");
    }

    const requestedDays = calculateBusinessDays(input.startDate, input.endDate);
    let validated: SplitLeaveResult | null = null;

    if (type.rows[0].tracks_balance) {
      const balance = await client.query<{ balance: number }>(
        `SELECT COALESCE(b.balance, 0)::float8 AS balance
           FROM leave_balances b
           JOIN leave_types lt ON lt.id = b.leave_type_id
          WHERE b.user_id = $1 AND lt.code = $2
          FOR UPDATE`,
        [input.userId, code],
      );
      const confirmed = balance.rows[0]?.balance ?? 0;

      const pending = await client.query<{ start_date: string; end_date: string }>(
        `SELECT r.start_date::text AS start_date, r.end_date::text AS end_date
           FROM leave_requests r
           JOIN leave_types lt ON lt.id = r.leave_type_id
          WHERE r.user_id = $1
            AND lt.code = $2
            AND r.status = 'pending'
            AND NOT r.is_deleted`,
        [input.userId, code],
      );
      const pendingDays = pending.rows.reduce(
        (sum, row) => sum + calculateBusinessDays(row.start_date, row.end_date),
        0,
      );
      const remainingLive = confirmed - pendingDays;

      if (requestedDays > remainingLive) {
        validated = splitLeaveRange({
          startDate: input.startDate,
          endDate: input.endDate,
          remaining: remainingLive,
        });
      }
    }

    const split = Boolean(validated && (validated.paid ?? validated.unpaid));

    const segments: { code: string; start: string; end: string }[] = [];
    if (split) {
      if (validated!.paid) {
        segments.push({ code, start: validated!.paid.start, end: validated!.paid.end });
      }
      if (validated!.unpaid) {
        segments.push({
          code: "unpaid",
          start: validated!.unpaid.start,
          end: validated!.unpaid.end,
        });
      }
    } else {
      segments.push({ code, start: input.startDate, end: input.endDate });
    }

    const unpaidType = await client.query<{ id: string }>(
      `SELECT id FROM leave_types WHERE code = 'unpaid'`,
    );
    if (!unpaidType.rows[0]) {
      throw new AppError("CONFIGURATION_ERROR", "Unpaid leave type is not configured", 500);
    }

    const requests: DbLeaveRequest[] = [];
    for (const segment of segments) {
      const leaveTypeId = segment.code === "unpaid" ? unpaidType.rows[0].id : type.rows[0].id;
      const created = await client.query<{
        id: string;
        user_id: string;
        start_date: string;
        end_date: string;
        reason: string;
        status: string;
        created_at: Date;
      }>(
        `INSERT INTO leave_requests (user_id, leave_type_id, start_date, end_date, reason)
         VALUES ($1, $2, $3::date, $4::date, $5)
         RETURNING id, user_id, start_date::text AS start_date, end_date::text AS end_date,
                   reason, status, created_at`,
        [input.userId, leaveTypeId, segment.start, segment.end, input.reason],
      );
      await client.query(
        `INSERT INTO audit_log (leave_request_id, actor_id, action)
         VALUES ($1, $2, 'submitted')`,
        [created.rows[0].id, input.actorId],
      );
      requests.push(
        toWireLeaveRequest({
          ...created.rows[0],
          leave_type_code: segment.code,
          decided_by: null,
          decided_at: null,
          is_deleted: false,
        }),
      );
    }

    let message: string;
    if (split) {
      const paidCount = validated!.paid
        ? calculateBusinessDays(validated!.paid.start, validated!.paid.end)
        : 0;
      const unpaidCount = validated!.unpaid
        ? calculateBusinessDays(validated!.unpaid.start, validated!.unpaid.end)
        : 0;
      message =
        paidCount > 0
          ? `Requested ${requestedDays} days exceeded your balance, so it was filed as ${paidCount} day(s) of ${type.rows[0].name} and ${unpaidCount} day(s) of Unpaid.`
          : `Requested ${requestedDays} days exceeded your balance, so the full ${unpaidCount} day(s) were filed as Unpaid.`;
    } else {
      message = "";
    }

    await client.query("COMMIT");

    if (split) {
      try {
        await insertNotification(
          getPool(),
          input.userId,
          "Leave split into Paid and Unpaid",
          message,
        );
      } catch (notificationError) {
        console.error("[leave] split notification skipped (best-effort):", notificationError);
      }
    }

    return { requests, split };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

async function insertNotification(
  pool: { query: Pool["query"] },
  userId: string,
  title: string,
  message: string,
): Promise<void> {
  await pool.query(`INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`, [
    userId,
    title,
    message,
  ]);
}

export async function listNotificationsForUser(userId: string): Promise<{
  items: NotificationItem[];
  unreadCount: number;
}> {
  const items = await getPool().query<NotificationItem>(
    `SELECT id, title, message, read_at::text AS read_at, created_at::text AS created_at
       FROM notifications
      WHERE user_id = $1
      ORDER BY read_at NULLS FIRST, created_at DESC
      LIMIT 20`,
    [userId],
  );
  const unread = await getPool().query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
       FROM notifications
      WHERE user_id = $1 AND read_at IS NULL`,
    [userId],
  );
  return { items: items.rows, unreadCount: Number(unread.rows[0]?.count ?? 0) };
}

export async function markNotificationRead(id: string, userId: string): Promise<void> {
  const result = await getPool().query(
    `UPDATE notifications SET read_at = now() WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  if (result.rowCount === 0) {
    throw new AppError("NOT_FOUND", "Notification not found", 404);
  }
}

export async function listRequestsForUser(userId: string): Promise<MyLeaveRequest[]> {
  const { rows } = await getPool().query<{
    id: string;
    user_id: string;
    leave_type_code: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: "pending" | "approved" | "rejected";
    decided_by: string | null;
    decided_at: Date | null;
    is_deleted: boolean;
    created_at: Date;
    rejection_reason: string | null;
  }>(
    `SELECT r.id, r.user_id, lt.code AS leave_type_code,
            r.start_date::text AS start_date, r.end_date::text AS end_date,
            r.reason, r.status, r.decided_by, r.decided_at,
            r.is_deleted, r.created_at,
            (SELECT al.details
               FROM audit_log al
              WHERE al.leave_request_id = r.id
                AND al.action = 'rejected'
              ORDER BY al.occurred_at DESC
              LIMIT 1) AS rejection_reason
       FROM leave_requests r
       JOIN leave_types lt ON lt.id = r.leave_type_id
      WHERE r.user_id = $1 AND NOT r.is_deleted
      ORDER BY r.created_at DESC`,
    [userId],
  );
  return rows.map((row) => ({
    ...toWireLeaveRequest(row),
    rejection_reason: row.rejection_reason,
  }));
}

export async function listTeamPendingRequests(managerId: string): Promise<EnrichedLeaveRequest[]> {
  const { rows } = await getPool().query<{
    id: string;
    user_id: string;
    leave_type_code: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: "pending" | "approved" | "rejected";
    decided_by: string | null;
    decided_at: Date | null;
    is_deleted: boolean;
    created_at: Date;
    employee_name: string;
    leave_type_name: string;
  }>(
    `SELECT r.id, r.user_id, lt.code AS leave_type_code,
            r.start_date::text AS start_date, r.end_date::text AS end_date,
            r.reason, r.status, r.decided_by, r.decided_at,
            r.is_deleted, r.created_at,
            u.name AS employee_name, lt.name AS leave_type_name
       FROM leave_requests r
       JOIN users u ON u.id = r.user_id
       JOIN leave_types lt ON lt.id = r.leave_type_id
      WHERE u.manager_id = $1
        AND r.status = 'pending'
        AND NOT r.is_deleted
      ORDER BY r.created_at`,
    [managerId],
  );
  return rows.map((row) => ({
    ...toWireLeaveRequest(row),
    employeeName: row.employee_name,
    leaveTypeName: row.leave_type_name,
    totalDays: calculateBusinessDays(row.start_date, row.end_date),
  }));
}

export async function decideLeaveRequest(input: {
  requestId: string;
  actorId: string;
  decision: "approved" | "rejected";
  rejectReason?: string | null;
}): Promise<DbLeaveRequest> {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query<{
      id: string;
      user_id: string;
      leave_type_id: string;
      leave_type_code: string;
      start_date: string;
      end_date: string;
      reason: string;
      status: string;
      decided_by: string | null;
      decided_at: Date | null;
      is_deleted: boolean;
      created_at: Date;
      tracks_balance: boolean;
      request_manager_id: string | null;
    }>(
      `SELECT r.id, r.user_id, r.leave_type_id, lt.code AS leave_type_code,
              r.start_date::text AS start_date, r.end_date::text AS end_date,
              r.reason, r.status, r.decided_by, r.decided_at,
              r.is_deleted, r.created_at,
              lt.tracks_balance, u.manager_id AS request_manager_id
         FROM leave_requests r
         JOIN leave_types lt ON lt.id = r.leave_type_id
         JOIN users u ON u.id = r.user_id
        WHERE r.id = $1
        FOR UPDATE OF r`,
      [input.requestId],
    );

    const row = rows[0];
    if (!row) {
      throw new AppError("NOT_FOUND", "Leave request not found", 404);
    }
    if (row.status !== "pending") {
      throw new AppError("VALIDATION_ERROR", "Request has already been decided");
    }
    if (row.request_manager_id !== input.actorId) {
      throw new AppError("FORBIDDEN", "You can only act on your direct reports' requests", 403);
    }

    const days = calculateBusinessDays(row.start_date, row.end_date);
    let availableBalance: number | null = null;

    if (input.decision === "approved" && row.tracks_balance) {
      const balance = await client.query<{ balance: number }>(
        `SELECT balance::float8 AS balance
           FROM leave_balances
          WHERE user_id = $1 AND leave_type_id = $2
          FOR UPDATE`,
        [row.user_id, row.leave_type_id],
      );

      if (!balance.rows[0]) {
        throw new AppError(
          "BALANCE_NOT_FOUND",
          "No leave balance record exists for this request; cannot approve without deducting",
          400,
        );
      }
      availableBalance = balance.rows[0].balance;
      if (availableBalance < days) {
        throw new AppError(
          "INSUFFICIENT_BALANCE",
          `Insufficient balance: ${availableBalance} available, ${days} requested`,
          400,
        );
      }
    }

    await client.query(
      `UPDATE leave_requests
          SET status = $2, decided_by = $3, decided_at = now()
        WHERE id = $1`,
      [input.requestId, input.decision, input.actorId],
    );

    if (input.decision === "approved" && row.tracks_balance) {
      const deduction = await client.query(
        `UPDATE leave_balances
            SET balance = balance - $1, updated_at = now()
          WHERE user_id = $2 AND leave_type_id = $3 AND balance >= $1`,
        [days, row.user_id, row.leave_type_id],
      );
      if (deduction.rowCount === 0) {
        throw new AppError(
          "INSUFFICIENT_BALANCE",
          `Insufficient balance: ${availableBalance} available, ${days} requested`,
          400,
        );
      }
    }

    await client.query(
      `INSERT INTO audit_log (leave_request_id, actor_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [
        input.requestId,
        input.actorId,
        input.decision,
        input.decision === "rejected" ? (input.rejectReason ?? null) : null,
      ],
    );

    await client.query("COMMIT");

    return toWireLeaveRequest({
      ...row,
      status: input.decision,
      decided_by: input.actorId,
      decided_at: new Date(),
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listAuditReport(userId: string): Promise<AuditReportRequest[]> {
  const { rows } = await getPool().query<{
    id: string;
    leave_type_code: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: "pending" | "approved" | "rejected";
    decided_by: string | null;
    decided_at: Date | null;
    created_at: Date;
    audit_id: string | null;
    audit_actor_id: string | null;
    audit_action: string | null;
    audit_details: string | null;
    audit_occurred_at: Date | null;
  }>(
    `SELECT r.id, lt.code AS leave_type_code,
            r.start_date::text AS start_date, r.end_date::text AS end_date,
            r.reason, r.status, r.decided_by, r.decided_at, r.created_at,
            a.id AS audit_id, a.actor_id AS audit_actor_id,
            a.action AS audit_action, a.details AS audit_details,
            a.occurred_at AS audit_occurred_at
       FROM leave_requests r
       JOIN leave_types lt ON lt.id = r.leave_type_id
       LEFT JOIN audit_log a ON a.leave_request_id = r.id
      WHERE r.user_id = $1 AND NOT r.is_deleted
      ORDER BY r.created_at, a.occurred_at`,
    [userId],
  );

  const byRequest = new Map<string, AuditReportRequest>();
  for (const row of rows) {
    let request = byRequest.get(row.id);
    if (!request) {
      request = {
        id: row.id,
        leave_type_id: toWireLeaveTypeId(row.leave_type_code),
        start_date: row.start_date,
        end_date: row.end_date,
        reason: row.reason,
        status: row.status,
        decided_by: row.decided_by,
        decided_at: row.decided_at instanceof Date ? row.decided_at.toISOString() : row.decided_at,
        created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
        auditEntries: [],
      };
      byRequest.set(row.id, request);
    }
    if (row.audit_id) {
      request.auditEntries.push({
        id: row.audit_id,
        leave_request_id: row.id,
        actor_id: row.audit_actor_id ?? "",
        action: row.audit_action ?? "",
        details: row.audit_details ?? null,
        occurred_at:
          row.audit_occurred_at instanceof Date
            ? row.audit_occurred_at.toISOString()
            : (row.audit_occurred_at ?? ""),
      });
    }
  }

  return [...byRequest.values()];
}

export interface EmployeeManagementRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  manager_id: string | null;
  manager_name: string | null;
}

export async function listEmployeesForManagement(): Promise<EmployeeManagementRow[]> {
  const { rows } = await getPool().query<EmployeeManagementRow>(
    `SELECT u.id, u.name, u.email, u.role, u.manager_id, m.name AS manager_name
       FROM users u
       LEFT JOIN users m ON m.id = u.manager_id
      WHERE u.role IN ('employee', 'manager')
      ORDER BY u.role, u.name`,
  );
  return rows;
}

export async function updateEmployeeManager(id: string, managerId: string | null): Promise<void> {
  const target = await getPool().query<{ role: UserRole }>(`SELECT role FROM users WHERE id = $1`, [
    id,
  ]);
  if (target.rowCount === 0) {
    throw new AppError("NOT_FOUND", "Employee not found", 404);
  }
  if (target.rows[0].role !== "employee") {
    throw new AppError("VALIDATION_ERROR", "Only employees can be assigned a manager", 400);
  }

  if (managerId) {
    if (managerId === id) {
      throw new AppError("VALIDATION_ERROR", "An employee cannot be their own manager", 400);
    }
    const manager = await getPool().query<{ role: UserRole }>(
      `SELECT role FROM users WHERE id = $1`,
      [managerId],
    );
    if (manager.rowCount === 0) {
      throw new AppError("NOT_FOUND", "Manager not found", 404);
    }
    if (manager.rows[0].role !== "manager") {
      throw new AppError("VALIDATION_ERROR", "Manager must have the manager role", 400);
    }
  }

  await getPool().query(`UPDATE users SET manager_id = $2 WHERE id = $1`, [id, managerId]);
}

export async function promoteEmployee(id: string): Promise<EmployeeManagementRow> {
  const target = await getPool().query<{ role: UserRole }>(`SELECT role FROM users WHERE id = $1`, [
    id,
  ]);
  if (target.rowCount === 0) {
    throw new AppError("NOT_FOUND", "Employee not found", 404);
  }
  if (target.rows[0].role !== "employee") {
    throw new AppError("VALIDATION_ERROR", "Only employees can be promoted to manager", 400);
  }

  await getPool().query(`UPDATE users SET role = 'manager' WHERE id = $1`, [id]);

  const { rows } = await getPool().query<EmployeeManagementRow>(
    `SELECT u.id, u.name, u.email, u.role, u.manager_id, m.name AS manager_name
       FROM users u
       LEFT JOIN users m ON m.id = u.manager_id
      WHERE u.id = $1`,
    [id],
  );
  return rows[0];
}

export interface AuditUserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  manager_id: string | null;
}

export async function listUsersForAudit(): Promise<AuditUserRow[]> {
  const { rows } = await getPool().query<AuditUserRow>(
    `SELECT id, name, email, role, manager_id FROM users ORDER BY name`,
  );
  return rows;
}

export async function accrueBalances(): Promise<number> {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    await client.query(`SELECT pg_advisory_xact_lock(hashtext('leavetrack_accrual'))`);

    const result = await client.query(
      `UPDATE leave_balances b
          SET balance = b.balance + p.accrual_per_month,
              updated_at = now(),
              accrued_at = now()
         FROM leave_policies p
        WHERE b.user_id = p.user_id
          AND b.leave_type_id = p.leave_type_id
          AND p.accrual_per_month > 0
          AND (b.accrued_at IS NULL
               OR to_char(b.accrued_at AT TIME ZONE 'UTC', 'YYYY-MM')
                  <> to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM'))`,
    );

    await client.query("COMMIT");
    return result.rowCount ?? 0;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

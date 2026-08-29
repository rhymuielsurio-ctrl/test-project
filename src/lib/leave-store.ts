import { getPool } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { UserRole } from "@/lib/auth";
import {
  calculateBusinessDays,
  type BalanceInfo,
  type DbAuditLog,
  type DbLeaveRequest,
} from "@/lib/mock-data";

export const OVERBALANCE_ALLOWANCE_DAYS = 7;

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
      if (availableBalance + OVERBALANCE_ALLOWANCE_DAYS < days) {
        throw new AppError(
          "INSUFFICIENT_BALANCE",
          `Insufficient balance: ${availableBalance} available, ${days} requested (max overage ${OVERBALANCE_ALLOWANCE_DAYS} days)`,
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
          WHERE user_id = $2 AND leave_type_id = $3 AND balance >= $1 - $4`,
        [days, row.user_id, row.leave_type_id, OVERBALANCE_ALLOWANCE_DAYS],
      );
      if (deduction.rowCount === 0) {
        throw new AppError(
          "INSUFFICIENT_BALANCE",
          `Insufficient balance: ${availableBalance} available, ${days} requested (max overage ${OVERBALANCE_ALLOWANCE_DAYS} days)`,
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

import { getPool } from "./db";
import { AppError } from "./errors";
import {
  calculateBusinessDays,
  type BalanceInfo,
  type DbAuditLog,
  type DbLeaveRequest,
} from "./mock-data";

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
}): Promise<DbLeaveRequest> {
  const code = input.wireLeaveTypeId.replace(/^lt-/, "");

  const type = await getPool().query<LeaveTypeRow>(
    `SELECT id, code, name, tracks_balance FROM leave_types WHERE code = $1`,
    [code],
  );
  if (!type.rows[0]) {
    throw new AppError("VALIDATION_ERROR", "Invalid leave type");
  }

  const created = await getPool().query<{
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
     RETURNING id, user_id, start_date, end_date, reason, status, created_at`,
    [input.userId, type.rows[0].id, input.startDate, input.endDate, input.reason],
  );

  const row = created.rows[0];
  return toWireLeaveRequest({
    ...row,
    leave_type_code: code,
    decided_by: null,
    decided_at: null,
    is_deleted: false,
  });
}

export async function insertAuditLog(entry: {
  leaveRequestId: string;
  actorId: string;
  action: string;
}): Promise<void> {
  await getPool().query(
    `INSERT INTO audit_log (leave_request_id, actor_id, action)
     VALUES ($1, $2, $3)`,
    [entry.leaveRequestId, entry.actorId, entry.action],
  );
}

export async function listRequestsForUser(userId: string): Promise<DbLeaveRequest[]> {
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
  }>(
    `SELECT r.id, r.user_id, lt.code AS leave_type_code,
            r.start_date::text AS start_date, r.end_date::text AS end_date,
            r.reason, r.status, r.decided_by, r.decided_at,
            r.is_deleted, r.created_at
       FROM leave_requests r
       JOIN leave_types lt ON lt.id = r.leave_type_id
      WHERE r.user_id = $1 AND NOT r.is_deleted
      ORDER BY r.created_at`,
    [userId],
  );
  return rows.map(toWireLeaveRequest);
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
      balance: number | null;
    }>(
      `SELECT r.id, r.user_id, r.leave_type_id, lt.code AS leave_type_code,
              r.start_date::text AS start_date, r.end_date::text AS end_date,
              r.reason, r.status, r.decided_by, r.decided_at,
              r.is_deleted, r.created_at,
              lt.tracks_balance, u.manager_id AS request_manager_id,
              b.balance::float8 AS balance
         FROM leave_requests r
         JOIN leave_types lt ON lt.id = r.leave_type_id
         JOIN users u ON u.id = r.user_id
         LEFT JOIN leave_balances b
                ON b.user_id = r.user_id AND b.leave_type_id = r.leave_type_id
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

    if (input.decision === "approved" && row.tracks_balance) {
      const days = calculateBusinessDays(row.start_date, row.end_date);
      if (row.balance === null) {
        throw new AppError(
          "BALANCE_NOT_FOUND",
          "No leave balance record exists for this request; cannot approve without deducting",
          400,
        );
      }
      if (row.balance < days) {
        throw new AppError(
          "INSUFFICIENT_BALANCE",
          `Insufficient balance: ${row.balance} available, ${days} requested`,
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
      const days = calculateBusinessDays(row.start_date, row.end_date);
      await client.query(
        `UPDATE leave_balances
            SET balance = balance - $1, updated_at = now()
          WHERE user_id = $2 AND leave_type_id = $3`,
        [days, row.user_id, row.leave_type_id],
      );
    }

    await client.query(
      `INSERT INTO audit_log (leave_request_id, actor_id, action)
       VALUES ($1, $2, $3)`,
      [input.requestId, input.actorId, input.decision],
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
    audit_occurred_at: Date | null;
  }>(
    `SELECT r.id, lt.code AS leave_type_code,
            r.start_date::text AS start_date, r.end_date::text AS end_date,
            r.reason, r.status, r.decided_by, r.decided_at, r.created_at,
            a.id AS audit_id, a.actor_id AS audit_actor_id,
            a.action AS audit_action, a.occurred_at AS audit_occurred_at
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
        occurred_at:
          row.audit_occurred_at instanceof Date
            ? row.audit_occurred_at.toISOString()
            : (row.audit_occurred_at ?? ""),
      });
    }
  }

  return [...byRequest.values()];
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
               OR date_trunc('month', b.accrued_at) <> date_trunc('month', now()))`,
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

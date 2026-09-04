import { afterEach, describe, expect, it } from "vitest";
import { createPool } from "./db";
import { decideLeaveRequest } from "@/lib/leave-store";

const noDb = !process.env.DATABASE_URL;

const MAN = "bbbbbbbb-0000-0000-0000-0000000000b1";
const EMP = "bbbbbbbb-0000-0000-0000-0000000000c1";
const UNRELATED = "bbbbbbbb-0000-0000-0000-0000000000d1";

async function vacationTypeId(pool: Awaited<ReturnType<typeof createPool>>): Promise<string> {
  const r = await pool.query<{ id: string }>(
    `SELECT id::text AS id FROM leave_types WHERE code = 'vacation'`,
  );
  return r.rows[0].id;
}

describe.skipIf(noDb)("decideLeaveRequest", () => {
  const pool = createPool();

  afterEach(async () => {
    await pool.query(
      `DELETE FROM audit_log WHERE leave_request_id IN (SELECT id FROM leave_requests WHERE user_id = $1)`,
      [EMP],
    );
    await pool.query(`DELETE FROM notifications WHERE user_id = $1 OR user_id = $2`, [EMP, MAN]);
    await pool.query(`DELETE FROM leave_requests WHERE user_id = $1`, [EMP]);
    await pool.query(`DELETE FROM leave_balances WHERE user_id = $1`, [EMP]);
    await pool.query(`DELETE FROM users WHERE id = $1 OR id = $2 OR id = $3`, [
      MAN,
      EMP,
      UNRELATED,
    ]);
  });

  it("approves and deducts the business days from the employee balance", async () => {
    const vacationId = await vacationTypeId(pool);
    await pool.query(
      `INSERT INTO users (id, name, email, role, manager_id) VALUES
        ($1, 'Decision Manager', 'decision-manager@example.com', 'manager', NULL),
        ($2, 'Decision Employee', 'decision-employee@example.com', 'employee', $1)`,
      [MAN, EMP],
    );
    await pool.query(
      `INSERT INTO leave_balances (user_id, leave_type_id, balance) VALUES ($1, $2, 10.00)`,
      [EMP, vacationId],
    );
    const req = await pool.query<{ id: string }>(
      `INSERT INTO leave_requests (user_id, leave_type_id, start_date, end_date, reason)
       VALUES ($1, $2, '2026-09-07', '2026-09-08', 'decision test')
       RETURNING id::text AS id`,
      [EMP, vacationId],
    );

    const updated = await decideLeaveRequest({
      requestId: req.rows[0].id,
      actorId: MAN,
      decision: "approved",
    });

    expect(updated.status).toBe("approved");
    const bal = await pool.query<{ balance: string }>(
      `SELECT balance::text AS balance FROM leave_balances WHERE user_id = $1 AND leave_type_id = $2`,
      [EMP, vacationId],
    );
    expect(bal.rows[0].balance).toBe("8.00");
  });

  it("rejects without touching the balance", async () => {
    const vacationId = await vacationTypeId(pool);
    await pool.query(
      `INSERT INTO users (id, name, email, role, manager_id) VALUES
        ($1, 'Decision Manager2', 'decision-manager2@example.com', 'manager', NULL),
        ($2, 'Decision Employee2', 'decision-employee2@example.com', 'employee', $1)`,
      [MAN, EMP],
    );
    await pool.query(
      `INSERT INTO leave_balances (user_id, leave_type_id, balance) VALUES ($1, $2, 10.00)`,
      [EMP, vacationId],
    );
    const req = await pool.query<{ id: string }>(
      `INSERT INTO leave_requests (user_id, leave_type_id, start_date, end_date, reason)
       VALUES ($1, $2, '2026-09-07', '2026-09-08', 'decision test reject')
       RETURNING id::text AS id`,
      [EMP, vacationId],
    );

    const updated = await decideLeaveRequest({
      requestId: req.rows[0].id,
      actorId: MAN,
      decision: "rejected",
      rejectReason: "Not enough coverage",
    });

    expect(updated.status).toBe("rejected");
    const bal = await pool.query<{ balance: string }>(
      `SELECT balance::text AS balance FROM leave_balances WHERE user_id = $1 AND leave_type_id = $2`,
      [EMP, vacationId],
    );
    expect(bal.rows[0].balance).toBe("10.00");
  });

  it("forbids a non-manager from acting", async () => {
    const vacationId = await vacationTypeId(pool);
    await pool.query(
      `INSERT INTO users (id, name, email, role, manager_id) VALUES
        ($1, 'Decision Manager3', 'decision-manager3@example.com', 'manager', NULL),
        ($2, 'Decision Employee3', 'decision-employee3@example.com', 'employee', $1),
        ($3, 'Unrelated', 'unrelated@example.com', 'employee', $1)`,
      [MAN, EMP, UNRELATED],
    );
    await pool.query(
      `INSERT INTO leave_balances (user_id, leave_type_id, balance) VALUES ($1, $2, 10.00)`,
      [EMP, vacationId],
    );
    const req = await pool.query<{ id: string }>(
      `INSERT INTO leave_requests (user_id, leave_type_id, start_date, end_date, reason)
       VALUES ($1, $2, '2026-09-07', '2026-09-08', 'decision test forbid')
       RETURNING id::text AS id`,
      [EMP, vacationId],
    );

    await expect(
      decideLeaveRequest({
        requestId: req.rows[0].id,
        actorId: UNRELATED,
        decision: "approved",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

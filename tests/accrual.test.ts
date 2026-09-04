import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { createPool } from "./db";
import { accrueBalances } from "@/lib/leave-store";

interface BalanceRow {
  id: string;
  user_id: string;
  leave_type_id: string;
  balance: string;
  accrued_at: string | null;
}

const describeDb = describe;

const noDb = !process.env.DATABASE_URL;

describeDb.skipIf(noDb)("accrueBalances", () => {
  const pool = createPool();
  const throwawayId = "aaaaaaaa-0000-0000-0000-00000000aa01";
  const throwawayLeaveTypeId = "aaaaaaaa-0000-0000-0000-00000000bb01";

  const snapshot: BalanceRow[] = [];
  const createdBalanceIds: string[] = [];

  async function resetThrowawayBalance(nextMonthAccruedAt: string): Promise<void> {
    await pool.query(
      `INSERT INTO users (id, name, email, role)
       VALUES ($1, 'Accrual Test', 'accrual-test@example.com', 'employee')
       ON CONFLICT (id) DO NOTHING`,
      [throwawayId],
    );
    await pool.query(
      `INSERT INTO leave_types (id, name, code, tracks_balance)
       VALUES ($1, 'AccrualTest', 'accrualtest', true)
       ON CONFLICT (id) DO NOTHING`,
      [throwawayLeaveTypeId],
    );
    await pool.query(
      `INSERT INTO leave_policies (id, user_id, leave_type_id, accrual_per_month)
       VALUES (gen_random_uuid(), $1, $2, 1.50)
       ON CONFLICT (user_id, leave_type_id) DO UPDATE SET accrual_per_month = EXCLUDED.accrual_per_month`,
      [throwawayId, throwawayLeaveTypeId],
    );
    const bal = await pool.query<{ id: string }>(
      `INSERT INTO leave_balances (user_id, leave_type_id, balance, accrued_at)
       VALUES ($1, $2, 3.00, $3::timestamptz)
       ON CONFLICT (user_id, leave_type_id) DO UPDATE SET
         balance = EXCLUDED.balance, accrued_at = EXCLUDED.accrued_at
       RETURNING id`,
      [throwawayId, throwawayLeaveTypeId, nextMonthAccruedAt],
    );
    if (!createdBalanceIds.includes(bal.rows[0].id)) {
      createdBalanceIds.push(bal.rows[0].id);
    }
  }

  async function getThrowawayBalance(): Promise<string> {
    const r = await pool.query<{ balance: string }>(
      `SELECT balance::text AS balance FROM leave_balances WHERE user_id = $1 AND leave_type_id = $2`,
      [throwawayId, throwawayLeaveTypeId],
    );
    return r.rows[0].balance;
  }

  beforeEach(async () => {
    snapshot.length = 0;
    createdBalanceIds.length = 0;
    const all = await pool.query<BalanceRow>(
      `SELECT id::text AS id, user_id::text AS user_id, leave_type_id::text AS leave_type_id,
              balance::text AS balance, accrued_at::text AS accrued_at
         FROM leave_balances`,
    );
    snapshot.push(...all.rows);
  });

  afterEach(async () => {
    for (const id of createdBalanceIds) {
      await pool.query(`DELETE FROM leave_balances WHERE id = $1`, [id]);
    }
    await pool.query(`DELETE FROM leave_policies WHERE user_id = $1`, [throwawayId]);
    await pool.query(`DELETE FROM users WHERE id = $1`, [throwawayId]);
    await pool.query(`DELETE FROM leave_types WHERE id = $1`, [throwawayLeaveTypeId]);
    for (const row of snapshot) {
      await pool.query(
        `UPDATE leave_balances SET balance = $2, accrued_at = $3::timestamptz WHERE id = $1`,
        [row.id, row.balance, row.accrued_at],
      );
    }
  });

  it("accrues the monthly rate when the balance was last accrued in a prior month", async () => {
    const lastMonth = "2000-01-01 00:00:00+00";
    await resetThrowawayBalance(lastMonth);
    const before = parseFloat(await getThrowawayBalance());

    const changed = await accrueBalances();

    const after = parseFloat(await getThrowawayBalance());
    expect(after).toBeCloseTo(before + 1.5, 2);
    expect(changed).toBeGreaterThanOrEqual(1);
  });

  it("does not double-accrue within the same month (idempotent)", async () => {
    const lastMonth = "2000-01-01 00:00:00+00";
    await resetThrowawayBalance(lastMonth);

    await accrueBalances();
    const afterFirst = parseFloat(await getThrowawayBalance());

    await accrueBalances();
    const afterSecond = parseFloat(await getThrowawayBalance());

    expect(afterSecond).toBeCloseTo(afterFirst, 2);
  });
});

-- LeaveTrack v1.0 — Data layer migration (Day 1)
-- Moves leave balances/policies/accrual state into Postgres so the monthly
-- accrual cron (Vercel Cron + local offline job) runs without a filesystem.
--
--  1. leave_types gains a stable `code` ('vacation'/'sick'/'unpaid') that the
--     app maps to its wire ids ('lt-vacation'); the uuid PK stays internal.
--  2. leave_balances gains accrued_at for month-idempotent accrual.
--  3. One balance/policy row per (user_id, leave_type_id) — unique indexes.
--  4. Seeds policies (accrual rates) + opening balances for the 4 seeded dev
--     accounts, mirroring the old MOCK_LEAVE_POLICIES / MOCK_BALANCES.
-- Rerunnable (IF NOT EXISTS / ON CONFLICT).

BEGIN;

-- 1. leave_types — stable machine code for the app's `lt-*` wire ids
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS code text;

UPDATE leave_types SET code = 'vacation' WHERE code IS NULL AND name = 'Vacation';
UPDATE leave_types SET code = 'sick'     WHERE code IS NULL AND name = 'Sick';
UPDATE leave_types SET code = 'unpaid'   WHERE code IS NULL AND name = 'Unpaid';

CREATE UNIQUE INDEX IF NOT EXISTS leave_types_code_idx ON leave_types (code);
ALTER TABLE leave_types ALTER COLUMN code SET NOT NULL;

-- 2. accrual month guard on balances
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS accrued_at timestamptz;

-- 3. one row per (user_id, leave_type_id)
CREATE UNIQUE INDEX IF NOT EXISTS leave_policies_user_type_idx
  ON leave_policies (user_id, leave_type_id);
CREATE UNIQUE INDEX IF NOT EXISTS leave_balances_user_type_idx
  ON leave_balances (user_id, leave_type_id);

-- 4. seed accrual policies for the dev accounts
INSERT INTO leave_policies (user_id, leave_type_id, accrual_per_month)
SELECT u.id, lt.id, vals.accrual_per_month
  FROM   (VALUES
            ('00000000-0000-0000-0000-000000000001'::uuid, 'vacation'::text, 1.25::numeric(4,2)),
            ('00000000-0000-0000-0000-000000000001', 'sick',   1.00),
            ('00000000-0000-0000-0000-000000000004', 'vacation', 1.25),
            ('00000000-0000-0000-0000-000000000004', 'sick',     1.00)
          ) AS vals(user_id, code, accrual_per_month)
  JOIN   users      u  ON u.id  = vals.user_id
  JOIN   leave_types lt ON lt.code = vals.code
ON CONFLICT (user_id, leave_type_id) DO UPDATE
  SET accrual_per_month = EXCLUDED.accrual_per_month;

-- 5. seed opening balances (never clobber live balances on re-run)
INSERT INTO leave_balances (user_id, leave_type_id, balance, updated_at, accrued_at)
SELECT u.id, lt.id, vals.balance, now(), NULL
  FROM   (VALUES
            ('00000000-0000-0000-0000-000000000001'::uuid, 'vacation'::text, 10.00::numeric(5,2)),
            ('00000000-0000-0000-0000-000000000001', 'sick',    8.00),
            ('00000000-0000-0000-0000-000000000004', 'vacation',  5.00),
            ('00000000-0000-0000-0000-000000000004', 'sick',     12.00)
          ) AS vals(user_id, code, balance)
  JOIN   users      u  ON u.id  = vals.user_id
  JOIN   leave_types lt ON lt.code = vals.code
ON CONFLICT (user_id, leave_type_id) DO NOTHING;

COMMIT;
-- LeaveTrack v1.0 — Initial migration
-- Creates all 6 tables per ARCH-LeaveTrack-v1.0 data model.
-- Seed: leave_types with Vacation/Sick/paid.

BEGIN;

-- 1. users
CREATE TABLE users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  email      text NOT NULL UNIQUE,
  role       text NOT NULL CHECK (role IN ('employee', 'manager', 'hr_admin')),
  manager_id uuid REFERENCES users(id)
);

-- 2. leave_types (seeded below)
CREATE TABLE leave_types (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  tracks_balance boolean NOT NULL DEFAULT true
);

-- 3. leave_policies
CREATE TABLE leave_policies (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES users(id),
  leave_type_id     uuid NOT NULL REFERENCES leave_types(id),
  accrual_per_month numeric(4,2) NOT NULL
);

-- 4. leave_balances
CREATE TABLE leave_balances (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES users(id),
  leave_type_id  uuid NOT NULL REFERENCES leave_types(id),
  balance        numeric(5,2) NOT NULL DEFAULT 0,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- 5. leave_requests (soft-delete only — is_deleted defaults to false)
CREATE TABLE leave_requests (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES users(id),
  leave_type_id  uuid NOT NULL REFERENCES leave_types(id),
  start_date     date NOT NULL,
  end_date       date NOT NULL,
  reason         text NOT NULL,
  status         text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected')),
  decided_by     uuid REFERENCES users(id),
  decided_at     timestamptz,
  is_deleted     boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 6. audit_log
CREATE TABLE audit_log (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_request_id  uuid NOT NULL REFERENCES leave_requests(id),
  actor_id          uuid NOT NULL REFERENCES users(id),
  action            text NOT NULL,
  occurred_at       timestamptz NOT NULL DEFAULT now()
);

-- Seed leave_types
INSERT INTO leave_types (name, tracks_balance) VALUES
  ('Vacation', true),
  ('Sick',     true),
  ('Unpaid',   false);

COMMIT;

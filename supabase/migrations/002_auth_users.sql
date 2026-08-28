-- LeaveTrack v1.0 — Day 1: user auth backed by Postgres
-- Adds password hashing to users and a server-side session store.
-- Auth scheme: bearer token cookie ("session") holding a random token; the DB
-- stores only sha256(token) in sessions.token_hash, never the raw token.
-- Deterministic business uuids mirror the Day-1 MOCK_USERS re-key in
-- src/lib/mock-data.ts (00000000-...-0001..0004).
-- Rerunnable (ON CONFLICT / IF NOT EXISTS).

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash text NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS sessions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_token_hash_idx ON sessions (token_hash);

INSERT INTO users (id, name, email, role, manager_id)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Alice Chen',    'alice@example.com', 'employee', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000002', 'Bob Manager',   'bob@example.com',   'manager',  NULL),
  ('00000000-0000-0000-0000-000000000003', 'Carol Admin',   'carol@example.com', 'hr_admin', NULL),
  ('00000000-0000-0000-0000-000000000004', 'Dave Employee', 'dave@example.com',  'employee', '00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO UPDATE SET
  name       = EXCLUDED.name,
  email      = EXCLUDED.email,
  role       = EXCLUDED.role,
  manager_id = EXCLUDED.manager_id;

-- password_hash is set by scripts/seed.ts (bcrypt), which only runs on Day 1+
-- against a live database, so an empty default here is safe.

COMMIT;
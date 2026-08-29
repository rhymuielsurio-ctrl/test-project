-- LeaveTrack v1.0 — User notifications
-- Created by the over-balance split flow (paid/unpaid auto-tag) but is a
-- general per-user notification feed (bell in app shell).
-- Rerunnable (IF NOT EXISTS).

BEGIN;

CREATE TABLE IF NOT EXISTS notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      text NOT NULL,
  message    text NOT NULL,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON notifications (user_id, created_at DESC);

COMMIT;
-- LeaveTrack v1.0 — Audit trail rejection detail (HR visibility)
-- The rejection reason a manager enters is today validated then discarded:
-- audit_log has nowhere to hold it. Add a nullable `details` column so the
-- rejected audit entry can carry the manager's reason for the HR audit trail.
--
-- Nullable on purpose: submitted/approved entries and all historical rows have
-- no reason to show. Append-only log — no UPDATE/DELETE here. Rerunnable.
--
--  1. audit_log.details — free-text note attached to an audit entry.

BEGIN;

ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS details text;

COMMIT;
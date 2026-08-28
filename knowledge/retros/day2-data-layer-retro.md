# Day 2 retro — Postgres data-layer migration + Vercel Cron prep

## Completed

- Migration 003: `leave_types.code`, `leave_balances.accrued_at`, unique
  (user_id, leave_type_id) on policies/balances, seeded policies + opening
  balances (idempotent).
- `src/lib/leave-store.ts` replaces all mock array mutations; `mock-state.ts`
  deleted; leaving `mock-data.ts` as types + static rosters + pure helpers.
- Decision approval is now a single transaction (request lock → balance
  deduction for tracked types → audit row → commit).
- Accrual is SQL + advisory lock, month-idempotent; route accepts
  `Bearer $CRON_SECRET` or an `hr_admin` session.
- `scripts/accrual-job.ts` now runs the PG store (self-loads `.env`);
  `vercel.json` schedules `/api/jobs/accrual` on the 1st.
- E2E 21/21 against the live DB (create/approve/deduct/double-decision/
  audit/accrual idempotency/cron-auth).

## Backlog

- **Pre-existing format drift:** `src/lib/auth.ts` + `src/app/api/auth/login/route.ts`
  fail `format:check` (autocrlf artifact from the auth-fix commit). Intentionally
  NOT touched during this change to keep the diff clean. Run
  `npx prettier --write src/lib/auth.ts src/app/api/auth/login/route.ts` in a
  separate chore commit.
- **`.env.example` was missing** (AGENTS says it must exist) — created with
  placeholders. Its `DATABASE_URL` line is a stub; the real value stays in the
  gitignored `.env`.
- **`mock-state.json` gitignore-stanza + untracked file** are now dead
  (no persistence layer). Remove both once this branch merges.
- **Branch churn:** the plan assumed working on `feat/postgres-user-auth`, but
  PR #1 had been merged; work moved to a fresh `feat/postgres-data-layer` off
  updated `main`. Vercel Cron's `0 0 1 * *` is untested end-to-end until the
  app is deployed and `CRON_SECRET`/`DATABASE_URL` are set in the dashboard —
  local task `LeaveTrackAccrual` remains as dev fallback until then.
- Standing creds unused outside dev; the `*-dev-pass` reminder from the PR #1
  review is still open (host-guard `db:setup`).

## Post-review fixes (same day)

Code review before the PR flagged two HIGHs — both fixed and re-verified:

- **TOCTOU double-approval.** Proof: `FOR UPDATE OF r, b` is ILLEGAL in
  Postgres when `b` is the nullable side of a `LEFT JOIN` (error 0A000) — the
  balance is now locked by a separate `SELECT … FOR UPDATE` inside the same
  transaction, plus a conditional deduction (`… AND balance >= $1`, 0 rows →
  INSUFFICIENT_BALANCE) as belt-and-braces. This failed E2E exactly once (500)
  before the fix — great example of why you E2E the review fixes.
- **Timezone-relative accrual guard.** `date_trunc('month', now())` follows the
  session timezone (Vercel UTC vs local UTC+8) — the guard now compares
  `to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM')`.
- Cheap medium/lows folded in: create+audit atomic (audit insert lives inside
  `createLeaveRequest`), audit endpoint validates the user via DB `userExists`
  instead of the static roster, timing-safe `CRON_SECRET` compare, `@/lib/*`
  imports inside the store.
- Re-verified: typecheck/lint/build clean, E2E 20/20 + cron-auth 4/4,
  `accrual-job.ts` prints "Already accrued — skipped" under tsx with the new
  `@/` imports, wire dates come back `YYYY-MM-DD` (`::text` on INSERT RETURNING).
- FORBIDDEN path of the store's direct-report check wasn't E2E-exercised
  (only one manager in the roster); covered by unit logic + role gate.

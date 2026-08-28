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

## Notes

- pg DECIMAL → string; fixed with `::float8` at the query boundary so wire
  numbers/types never changed. See
  `knowledge/patterns/postgres-data-layer-swap.md`.
- FORBIDDEN path of the store's direct-report check wasn't E2E-exercised
  (only one manager in the roster); covered by unit logic + role gate.

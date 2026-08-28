# Pattern: Idempotent Postgres Migration Runner

## Context

Day-1 auth added `supabase/migrations/*.sql` files but nothing ever applied them —
against a fresh database `npm run seed` failed with `relation "users" does not
exist`. The app was "not connected" because schema DDL had no executor.

## Pattern

`scripts/migrate.ts` — a plain `pg` runner that needs nothing but `DATABASE_URL`:

- Reads `supabase/migrations/*.sql`, sorts by filename (timestamp/seq prefix), and
  executes each in a single connection.
- Tracks applied files in a `schema_migrations (id text PRIMARY KEY, applied_at
timestamptz)` ledger; already-applied files are skipped; re-runnable.
- Executes each file inside an outer transaction with an interesting ordering:
  **INSERT the ledger row BEFORE running the file's SQL**. Because the migrations
  wrap themselves in `BEGIN; ... COMMIT;`, the file's internal `COMMIT` persists
  both the DDL and the ledger row atomically. If the file fails, `ROLLBACK`
  undoes the ledger insert too — no "applied but unrecorded" window.
- Missing `DATABASE_URL` or a connection failure → `console.error` + `process.exit(1)`.

## Why

- The migration files stay the single source of truth for schema; the runner adds
  only ordering + idempotency.
- psql/supabase-style sequential files + a ledger table are the smallest thing
  that gives deterministic schema on any Postgres, no ORM or external tool.
- npm scripts do NOT auto-load `.env` — `db:migrate`/`db:setup` expect
  `DATABASE_URL` as a real environment variable (export it, or inject it).

## Constraints learned

- Migration files must be safe to re-run (002 uses `IF NOT EXISTS` / `ON
CONFLICT`; 001 is plain `CREATE TABLE` and relies on the ledger to never
  re-run — do not edit 001 to be rerunnable unless also re-platforming).
- Ledger-before-file ordering assumes each file's internal `COMMIT` is its last
  statement. A future migration with statements after `COMMIT` would strand the
  ledger row in a committed-but-incomplete transaction — keep files
  `BEGIN ... COMMIT`-atomic.
- `pg` simple query protocol executes the whole file as one multi-statement
  string (no parameters) — do not pass user input as the file content.

## Files

`scripts/migrate.ts`, `package.json` (`db:migrate`, `db:setup`),
`supabase/migrations/001_initial.sql`, `supabase/migrations/002_auth_users.sql`

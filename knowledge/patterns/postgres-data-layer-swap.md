# Mock-data Layer → Postgres (Next.js App Router leave domain)

Day-1 pattern for moving an in-repo mock array layer onto plain Postgres while
pinning the wire contract. Applied in Epic-3 (data-layer migration).

## Why

Serverless (Vercel) has no writable filesystem. Leave balances/requests/audit
must live in Postgres for the monthly accrual cron to run serverless.

## Key decisions

1. **Keep the wire ids; shift the ids.** The UI/validators speak `lt-vacation`,
   but `leave_types` PKs are uuid. Add a unique `code` column ('vacation'), map
   `wire = 'lt-' + code`, and move PKs into the data-access layer. The FK
   (`leave_requests.leave_type_id → leave_types(id)`) stays intact.
2. **One async store module (`src/lib/leave-store.ts`) returns existing `Db*`
   shapes.** Routes keep exactly the JSON they emitted before; nothing client
   side changed.
3. **pg returns DECIMAL as strings.** Cast at the query boundary
   (`balance::float8`) so routes still see `number` and existing error-message
   templates (`Insufficient balance: ${balance}…`) don't change.
4. **Decisions are transactional.**: one client/BEGIN/COMMIT that locks the
   request row (`FOR UPDATE OF r`), deducts the balance only for
   `tracks_balance` types, inserts the audit row, and rolls back on any error.
   Reject double-decision by reading status under the lock.
5. **Month-idempotent accrual in SQL.** `UPDATE … FROM leave_policies
WHERE accrued_at IS NULL OR date_trunc('month', accrued_at) <> date_trunc('month', now())`
   guarded by a session advisory lock
   (`pg_advisory_xact_lock(hashtext('leavetrack_accrual'))`) — race-proof and
   serverless-safe, no filesystem involved.
6. **Seeds must not clobber live state.** Opening balances upsert with
   `ON CONFLICT (user_id, leave_type_id) DO NOTHING`; rerunning `db:setup`
   after an accrual leaves `balance`/`accrued_at` intact.
7. **Cron auth = secret, not session.** Vercel Cron cannot hold a cookie; the
   accrual route accepts `Authorization: Bearer $CRON_SECRET` OR an `hr_admin`
   session (manual trigger), so local dev keeps working without a secret.

## Gotcha

TypeScript `x instanceof Date` fails to compile when the declared type is
`string` — keep declared pg row types honest (date columns are `::text` in SQL
or `Date` in TS; don't mix both in one branch).

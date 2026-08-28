# Pattern: Postgres-Backed Bearer-Token Sessions (own auth)

## Context

Day 1 auth replaced the Day 0 mock cookie session with server-verified sessions
sourced from the Postgres `users` table. Chosen over Supabase Auth (ADR-E001
revisited) so role/manager_id stay business-owned and no external auth provider
is required.

## Pattern

- Cookie: `session`, httpOnly, secure (prod), SameSite Lax, path `/`, 8h maxAge.
- Cookie value is a random 64-hex bearer token (`crypto.randomBytes(32)`).
- DB stores only `sha256(token)` in `sessions.token_hash` — the raw token never
  touches the database, so a DB leak cannot replay sessions.
- `sessions` row carries `user_id`, `expires_at`; reads join `users` for
  `{ userId, role, name }`. Expired rows are excluded by `expires_at > now()`.
- `users.role`/`users.manager_id` stay the business source of truth. Password is
  a bcrypt `password_hash` column; seeded by `scripts/seed.ts` (only on Day 1+).
- Routines:
  - login: find user by email → `bcrypt.compare` → insert session → set cookie.
  - `getMockSession()`: cookie → sha256 → join query → `MockSession | null`.
  - logout: `DELETE FROM sessions WHERE token_hash = $1` + clear cookie.
- Middleware is a **presence-only gate** (checks the cookie exists, matches Day-0
  shape); `requireAuth()` is the authoritative check in route handlers and server
  components. Rationale: middleware runs on the edge where `pg` cannot, and a
  256-bit random token cannot be forged.

## Files

- `src/lib/auth.ts` — token gen/hash, session CRUD, bcrypt verify, requireAuth
- `src/lib/db.ts` — pg pool singleton (globalThis, lazy, `DATABASE_URL`-gated)
- `supabase/migrations/002_auth_users.sql` — `password_hash` + `sessions` table
- `scripts/seed.ts` — idempotent account bootstrap (never resets existing hashes)

## Constraints learned

- User ids are deterministic uuids (`00000000-…-0001..0004`) shared between the DB
  seed and `MOCK_USERS` so the mock data layer resolves the same owner keys.
  Any persisted mock state (e.g. `mock-state.json`) must be re-keyed in lockstep
  or balances/team scope silently empty out.
- Without `DATABASE_URL` the app must still build/run: auth helpers return
  null / throw `AppError("CONFIGURATION_ERROR")`, never crash at import time.
- Middleware must not import `pg` (edge runtime) — keep it cookie-presence only.

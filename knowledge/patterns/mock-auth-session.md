# Pattern: Mock Auth Session in Next.js 16

## Context

Day 0 requires a working auth flow without real providers. ADR-E001 chose mock cookie sessions.

## Pattern

- Cookie name: `mock-session`, httpOnly, secure, 8h expiry
- Cookie value: JSON `{ userId, role, name }`
- `getMockSession()` reads from `cookies()` (async in Next.js 16)
- `requireAuth(allowedRoles?)` throws `AppError("UNAUTHORIZED"/"FORBIDDEN")`
- Server components read cookie directly — no Context provider
- `proxy.ts` reads cookie and redirects unauthenticated to `/login`
- Day 1: swap `setMockSession()` calls only; guard logic untouched

## Files

- `src/lib/auth.ts` — session helpers
- `src/proxy.ts` — route guard (scaffold)

## Seed-data-driven login (only seeded accounts)

Login must **not** accept an arbitrary name/role — it should resolve against the
seed accounts (a user can only sign in as one of the seeded users, with their
own seeded role).

- Day-0 `scripts/seed.ts` targets Supabase and never runs in mock mode, so the
  Day-0 seeded-user source of truth is the **mirror `MOCK_USERS`** in
  `src/lib/mock-data.ts` (identical rows: usr-001..usr-004).
- Login page is a client component and imports `MOCK_USERS` to render a
  **user-picker `<Select>`** (labels = seeded names) — the UI cannot type an
  arbitrary name.
- Login route (`POST /api/auth/login`) accepts `{ userId }`, resolves via
  `findUserById()`, **rejects unknown ids with `AppError("UNAUTHORIZED")`**, and
  derives `role`/`name` from the seed row before `setMockSession`. Never trust a
  client-supplied role/name.
- The session shape `{ userId, role, name }` is unchanged, so `requireAuth`, nav
  role-gating, and `proxy.ts` need no updates.

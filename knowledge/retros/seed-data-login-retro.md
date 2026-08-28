# RETRO: Seed-data-driven login (stop accepting "just any account")

**Date:** 2026-08-28
**Status:** Complete (ACs pass; all 4 seeded users verified + unknown rejected)

## What went well

- Identified early that `scripts/seed.ts` is Supabase-bound (Day 1+ only) and that
  its user rows are a 1:1 mirror of `MOCK_USERS` in `mock-data.ts`. So the Day-0
  seeded-user source of truth is `MOCK_USERS`, not the seed script — avoided a
  misleading "run seed.ts" dependency that can't run in mock mode.
- Login route now rejects unknown `userId` with `UNAUTHORIZED` (401) and derives
  `role`/`name` from the seed row server-side — never trusting client input.
- Login page swapped free-text name + role for a user-picker `<Select>` fed by
  `MOCK_USERS` (safe on the client, same pattern as `audit/page.tsx`).
- Empirical verification (curl): usr-001..usr-004 each resolve to their own role;
  an arbitrary/unknown id returns 401.
- Session shape `{ userId, role, name }` unchanged → no downstream churn in
  `requireAuth`, nav gating, or `proxy.ts`.

## Backlog items (deferred, not blockers)

- Login page defaults selection to `userOptions[0]` (Alice). Harmless Day-0 mock
  UX, but consider an explicit "select an account" placeholder if a no-selection
  state is preferred.
- `mock-data.ts` and `scripts/seed.ts` must stay in sync manually (two sources for
  the same seed users). A single shared seed fixture or a Day-0 loader that reads
  one source would prevent drift when seed data changes.

## Patterns contributed

- knowledge/patterns/mock-auth-session.md — added "Seed-data-driven login (only
  seeded accounts)" section.

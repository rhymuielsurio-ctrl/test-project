# Retro — Day 1: Postgres-Backed User Auth

## Summary

Replaced the Day 0 mock cookie session with real database-backed auth on plain
Postgres (pivot away from Supabase, mid-APPLY, per stakeholder direction).
Login now verifies bcrypt hashes against `users`, issues random bearer tokens
(sha256 stored), and middleware + requireAuth enforce the same guard shape.

## Fixed before merge (VALIDATE)

- `mock-state.json` still referenced old `usr-001` keys after the mock re-key —
  re-keyed to the shared seeded uuids so balances/team scope resolve.

## Backlog

- AGENTS.md + `docs/arch-docs/` (ARCH + ADR-E001) still document Supabase as the
  database/auth provider. Needs a doc revision to plain Postgres + own auth.
- `knowledge/patterns/mock-auth-session.md` is now stale (mentions Supabase seed).
  Superseded by `postgres-bearer-session-auth.md`; prune or cross-reference.
- `scripts/seed.ts` no longer seeds leave_types/policies/balances — their string
  ids (`lt-vacation`) are invalid for uuid columns. Leave domain seeding for Day-1
  data swap is a separate task (blocked on a full data-layer migration).
- Full data layer (leave_requests, balances) still in-repo mock arrays; moving to
  Postgres queries is follow-up work beyond auth.
- `generateSessionToken()` is exported from `src/lib/auth.ts` but only consumed
  internally — can be made private on the next touch.

## Verdict

Auth task itself is complete and gates green. Doc drift and data-layer swap are
tracked backlog, not defects.

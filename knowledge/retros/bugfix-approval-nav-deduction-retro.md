# RETRO: Bugfix — Approval Queue nav visibility + leave-credit deduction on approval

**Date:** 2026-08-28
**Status:** Complete (acceptance criteria pass)

## Bugs reported / root causes

1. **Manager couldn't see Approval Queue in nav.** Empirically the server-rendered
   nav DID show it for a manager (`role === "manager"` filter is correct). The real
   gap was a **client-navigation session-freshness issue**: after `router.push`
   on the login page (no `router.refresh()`), the server `Navbar` (reads the
   httpOnly cookie via `getMockSession()`) can render a stale role, defaulting to
   `"employee"` and hiding the manager-only link until a full reload.
   Fix: `router.refresh()` right after login (matches the existing logout pattern).
2. **Approving didn't deduct leave credits.** The in-memory `MOCK_BALANCES`
   deduction was correct within one process (proven 10 → 4), but it (a) resets on
   dev hot-reload / server restart and doesn't survive serverless instances, and
   (b) had a silent `if (balance)` no-op that approved-without-deducting whenever a
   balance row was missing.
   Fix: server-only file-backed persistence (`src/lib/mock-state.ts`) + explicit
   `BALANCE_NOT_FOUND` error instead of the silent no-op.

## What went well

- Empirical reproduction (curl against the live dev server) discriminated between
  "filter bug" vs "rendering/session timing" — it proved the nav filter was correct
  and the deduction mutation was correct in-process, which kept scope honest.
- Isolating all `node:fs` in a **server-only** module kept the client bundle safe
  even though `mock-data.ts` is imported by a client component.
- ID counters reconciled by deriving from the live array instead of a cached
  counter, so lazy hydration can never collide ids (`lr-001` dup).

## Backlog items (deferred, not blockers)

- **No durable persistence in production.** `mock-state.json` is local-disk only;
  Vercel serverless has read-only ephemeral FS, so save/load silently no-op and the
  mock reverts to ephemeral behavior there. Real durability = Day 1 + Supabase.
- **Repo-wide `format:check` still failing (pre-existing).** 22 of 25 files flagged
  were untouched by this work. Only modified files were formatted. Needs a one-time
  repo-wide `prettier --write` decision (out of scope of this bugfix).
- **`mock-state.json` in project root** — if code seeds change later, a stale state
  file becomes source of truth. Low risk for a mock; consider a `--reset` escape
  hatch or version tag in the file if it grows.
- **Audit log not persisted** — HR report requests persist but their `audit_log`
  entries don't survive restart. Fine for the reported bugs; revisit if audit
  durability becomes a requirement.

## Patterns contributed

- knowledge/patterns/server-only-mock-state-persistence.md

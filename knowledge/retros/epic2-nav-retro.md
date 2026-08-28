# RETRO: Epic 2 — Global Navigation Bar (TASK-FE-001 → 005)

**Date:** 2026-08-28
**Status:** Complete (14/14 AC pass)

## What went well

- Server-shell / client-leaf split kept the httpOnly session out of client JS;
  role filtering happens server-side so the Approval Queue link never reaches
  an employee's DOM.
- Reused existing `usePathname` + `next/link` for zero-reload routing and active
  state; mobile drawer uses fixed off-canvas positioning so no horizontal
  scrollbar at 375px.
- Build, typecheck, lint all green; only pre-existing (untouched) files fail the
  repo-wide `format:check`.

## Backlog items (deferred, not blockers)

- **Login page shows desktop nav + "Guest" profile** — RootLayout renders the
  Navbar on `/login` too. Not an AC failure (guarded routes redirect), but it's
  odd UI. Consider rendering the navbar only when a session exists, or hiding nav
  on `/login`.
- **`knowledge/design-system.md` Layout section is stale** — references a
  nonexistent `src/components/layout/app-shell.tsx` with a `lg:` 256px sidebar
  vision, but the actual nav is `navbar.tsx` (top bar). Align the doc with the
  implemented approach or decide between top-nav vs sidebar.
- **`docs/dev-tasks/epic-2-leave-request-task.csv.csv`** — `epic_link` says
  `EPIC-1` on all rows (this is Epic 2) and the filename has a double `.csv.csv`
  extension. Cosmetic, fix for traceability.

## Patterns contributed

- knowledge/patterns/server-edged-nav-shell.md

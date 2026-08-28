# RETRO: HR Audit nav link (role-gated nav generalization)

**Date:** 2026-08-28
**Status:** Complete (ACs pass, verified across all 3 roles)

## What went well

- Small, single-file change: generalized `NavLink` role-gating from a lone
  `managerOnly` boolean to a declarative `roles?: UserRole[]` allow-list and
  added the `hr_admin`-only "Audit" link. Both nav surfaces (desktop `navbar.tsx`
  and mobile drawer `mobile-nav.tsx`) render the same `NavLinks`, so one array
  gates everything.
- Empirically verified via the live server: employee → neither restricted link;
  manager → Approval Queue only; hr_admin → Audit only. No regression to the
  manager gate.
- Authorization stays server-side (`requireAuth(["hr_admin"])` on the audit
  route) — the nav link is pure visibility, matching AGENTS.md's enforced
  server-side rule.

## Backlog items (deferred, not blockers)

- none new added.

## Patterns contributed

- knowledge/patterns/server-edged-nav-shell.md — added "Role-gating nav links
  (declarative allow-list)" section.

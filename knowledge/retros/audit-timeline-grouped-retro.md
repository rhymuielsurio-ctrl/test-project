# Retro — Audit timeline grouped by request + user

**Task:** Separate the audit log timeline by request and by user for readability.
**Date:** 2026-08-29

## What was done

- `audit-activity-timeline.tsx`: single flattened chrono feed → grouped per-
  request MUI Paper blocks. Each group header: Avatar initial + `userName`
  (new optional prop resolved by the page), leave type + StatusBadge + date
  range; beneath it, that request's `Timeline` (submitted → decision, asc).
  Groups sorted by `created_at` desc. Decision-node dedupe preserved.
- `audit/page.tsx`: passes `userName` of the selected employee from MOCK_USERS.
- No API / data-layer / type-contract changes (reading A from eval).

## Validation

- typecheck / lint / prettier / `next build` green.
- Graph blast radius (858 nodes): audit-activity-timeline single community,
  1-hop page edge; no boundary crossings.
- SSR smoke (carol session): /audit MUI island intact (MuiSelect/MuiPaper),
  server cleaned up after.

## Patterns / quirks

- **MUI v9 Box/Stack:** system props (`display`, `justifyContent`, etc.) are no
  longer part of Box/Stack owned props; typing now REQUIRES `component` (e.g.
  `component="div"`). Responsive layout props move to `sx`
  (`flexDirection: { xs: "column", sm: "row" }`). Recorded to avoid repeat
  fixes in future MUI work on this stack.
- **Grouped feed reads better than flat:** request-header line (user · type ·
  status · dates) plus per-request timeline = skimmable; flat interleave hid
  request boundaries.

## Backlog

- ~5 uncommitted feature sets still in the working tree — commit before next
  task. Consider squashing the audit-history + MUI work into one PR.
- Reading B (org-wide view: all users → per-user → per-request) remains
  unbuilt; needs an all-users audit endpoint (listAuditReport is per-user).
- `ui/select` + `ui/card` now unused on audit page but still used elsewhere.

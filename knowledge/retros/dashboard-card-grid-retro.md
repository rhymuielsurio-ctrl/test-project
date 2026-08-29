# Dashboard Card Grid Retro

**Task:** Fix spacing after sidebar + card-based dashboard sections + audit history trail.
**Date:** 2026-08-28

## What was done

- `leave-requests/page.tsx`: container `max-w-3xl` → `max-w-5xl`. The fixed 256px
  sidebar already eats horizontal width; centering a 768px box inside that column
  left a dead gutter "after the sidebar". Widening to 1024px + the card grid fills it.
- "Available Balances": full-width stacked cards → responsive grid
  `grid gap-3 sm:grid-cols-2 lg:grid-cols-3` (mobile-first, per design-system).
- "My Requests": HTML table → compact `Card` list (type + `StatusBadge` row,
  dates, reason). Removes the last table on the balance page; `ui/table` still
  consumed by `manager-queue-table.tsx` (not orphaned).
- `leave-balance-card.tsx`: equal-height (`h-full`) for the grid; stats moved to
  `grid-cols-3 divide-x` centered columns (Confirmed / Pending / Remaining) with
  existing color coding. Prop API unchanged — no consumer churn.
- Audit history trail: already replaced the audit table in the prior task
  (`audit-history-list.tsx`, `audit-history-table.tsx` deleted). Verbatim in-tree.

## Validation

- typecheck, lint, prettier, `next build` all green.
- Graph blast-radius: `LeaveBalanceCard` has exactly one consumer; no community
  boundary crossings.

## Patterns

- **Responsive stat card grid:** wrap equal-height cards in
  `grid gap-3 sm:grid-cols-2 lg:grid-cols-3` + `h-full` on the card; replace a
  wrap-row stat footer with `grid-cols-3 divide-x` for a common "KPI strip" look.
- **Table→card list swap:** keep the row data shape, move actions/status into the
  header row (title left + badge right), strip table chrome via the shared
  `Card` primitive. Consistent with the audit history-trail swap.

## Backlog

- 36 files still failing `format:check` (pre-existing drift, untouched).
- Three uncommitted feature sets remain in the working tree (audit-reason,
  sidebar shell, audit history list) — commit before the next task.
- Reading the audit-history-list requires skipping the mere presence of
  `knowledge/retros/` prompts — consider adding retro files location to AGENTS
  structure listing.

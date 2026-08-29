# Retro — HR audit page: table → collapsible history trail

## Completed

- `audit-history-table.tsx` (data-grid Table) replaced by `audit-history-list.tsx`:
  one Card per request — header with leave type, StatusBadge, dates; collapsible
  "History (n)" trail in the body (rejection reason shown as
  `rejected — <reason>`); footer with decision maker + decided date.
- `audit/page.tsx` re-wired to `AuditHistoryList` (only consumer). `ui/table.tsx`
  NOT deleted — still imported by `manager-queue-table.tsx` and
  `leave-requests/page.tsx`.
- Verified: typecheck / lint / build green; prod smoke of `/api/audit/:id`
  returns entries including the stored rejection `details` (unchanged API, data
  intact).

## Pattern

- **Shared primitives ≠ owned by a single consumer.** `ui/table` looked "audit
  only" but was shared; grep before deleting. When migrating a consumer away
  from a primitive, check remaining importers before pruning the primitive.
- **Table → stacked card list** is the right presentation when rows carry
  one action trail rather than uniform tabular cells; keep the summary fields
  (status/dates/decider) as a card header so no data is lost in the visual
  change.

## Backlog

- **Pre-existing `format:check` drift (36 files)** — still untouched.
- **Combined uncommitted work-in-tree:** this session's three feature sets
  (audit-rejection-reason + migration 004, sidebar nav, audit history list) are
  uncommitted together. Commit in separate logical commits before merging to
  keep history bisectable.
- **Collapsible open-state:** trail stays collapsed by default (from the earlier
  audit-reason retro); consider default-open for rejected requests.

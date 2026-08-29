# Retro — Paid/Unpaid auto-split for over-balance filings

Date: 2026-08-29
Scope: `src/lib/leave-store.ts`, `src/app/api/leave-requests/route.ts`,
`src/components/features/notifications-popover.tsx`, migrations 005.

## What

When an employee files more business days than their remaining balance, the
submission is atomically split into TWO leave requests: a PAID segment
(original leave type, up to `floor(remaining)` business days from the start
date) and an UNPAID segment (the rest), plus a notification in a brand-new
per-user notification feed (migration 005, bell UI in the app shell).
Example: 5 remaining + 7 business days Mon–Fri → 5 paid + 2 unpaid.

## Verified split semantics

- `splitLeaveRange` walks the weekday grid: paid ends on the
  `floor(remaining)`-th weekday; unpaid resumes on the next weekday through
  the original end date (no gaps, no weekends counted).
- remaining ≥ requested → no split. remaining = 0 → entire request Unpaid
  (contiguous range). Fractional balances floor to whole paid days (a
  numeric(5,2) remainder has no representable weekday).
- Only `tracks_balance` types split; an 'Unpaid' filing never splits again.

## Concurrency & integrity

- Whole submission is one transaction: balance row `FOR UPDATE` (serializes
  concurrent submits), pending days recomputed inside the txn, both request
  rows + two 'submitted' audit entries committed in a single COMMIT.
- The notification feed write is BEST-EFFORT and POST-COMMIT by design
  (changed 2026-08-29): it runs on its own pooled connection after COMMIT in
  a try/catch that logs and drops. An auxiliary channel must never be able
  to abort a valid submission — a missing notifications table (migration 005
  unapplied) previously rolled back every over-balance filing.
  Postgres fails statements in a txn; the notification insert therefore
  MUST NOT share the submission transaction (a catch-and-continue there
  would meet "current transaction is aborted", 25P02). Hence the separate
  autocommit connection.
- Concurrent first-ever submits (no balance row → nothing to lock) both see
  remaining 0 → both all-unpaid, consistent outcome; acceptable.

## Why the notification feed

TASK-011 AC1 ("notifies the manager") was deferred to Day 1; this task's
"notify the user of the auto-tag" created the first consumer. The table is
generic (`title/message/read_at`) so future actors (manager review
notifications, HR actions) reuse it.

## Removed with supersession

`OVERBALANCE_ALLOWANCE_DAYS` and the relaxed approval guards are gone —
`decideLeaveRequest` enforces strict `balance >= days` again. See the
superseded allowance retro for the interim design.

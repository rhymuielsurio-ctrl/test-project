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

## Retro — fractional-balance message/split consistency (2026-08-29)

A user with fractional remaining balance (e.g. 5.5 accrued − 5 pending = 0.5)
saw "it will be split" while the filing landed as a single Unpaid request.
Root cause: the route's message keyed on `remaining > 0`, but a paid segment
needs a whole weekday — `splitLeaveRange` floors (`paidDays = floor(remaining)`),
so `0 < remaining < 1` produces zero paid days. Rule now re-enforced:

- The over-balance warning uses "split" language only when `remaining >= 1`;
  otherwise it says "filed as unpaid" — the message must never promise a split
  the floor-based math cannot deliver.
- `split` (the response + segment flag) is now `Boolean(validated.paid || validated.unpaid)`
  instead of `validated !== null`: a `{paid:null, unpaid:null}` no-split result
  previously set split=true and could persist zero request rows (reachable if
  pending days grew between the route's check and the txn).

Takeaway: message text and data-layer math must share one definition of
"splittable". Flooring convention: whole weekday for paid, remainder unpaid.

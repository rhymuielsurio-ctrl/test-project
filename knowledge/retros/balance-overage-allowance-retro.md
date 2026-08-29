# Retro — Over-balance allowance (+7 days) on approval

> SUPERSEDED 2026-08-29 by the paid/unpaid auto-split (see below). The
> allowance mechanism and its `OVERBALANCE_ALLOWANCE_DAYS` constant were
> REMOVED — with auto-split the paid segment can never exceed balance
> (paidDays = floor(remaining)), so the +7-day approval relaxation is
> unnecessary. Section "Behavior now" describes the reverted interim state.

Date: 2026-08-29
Scope: `src/lib/leave-store.ts`, `src/app/api/leave-requests/route.ts`

## What

Employee can file over their remaining balance but the manager's approve was
hard-blocked (`INSUFFICIENT_BALANCE`) whenever requested days exceeded the
confirmed balance — the "HR override" the submit warning promised did not
exist, so every over-balance filing was a dead end.

Business rule (verbal requirement): over-balance filings are valid up to a
**+7 day allowance**. Implemented as `OVERBALANCE_ALLOWANCE_DAYS = 7`
exported from `leave-store.ts` (single source of truth).

## Behavior now

- **Submit** (unchanged semantics, better copy): never blocked. Warning now
  distinguishes — within allowance → informational; beyond → "manager
  approval may be refused".
- **Approve**: allowed while `availableBalance + 7 >= requestedDays`;
  balance may go as low as `-7` (guarded deduction `balance >= days - 7`,
  bound params only). Beyond that → `INSUFFICIENT_BALANCE` 400 with the
  allowance in the message.
- **Unpaid** (`tracks_balance` false): both check and deduction skipped —
  US-08 AC2 intact.

## Verified design decisions

- **In-app logic, not schema.** No column/migration — the allowance is a
  policy constant. If it ever needs per-policy values, it becomes a column
  on `leave_policies` + a migration.
- **Both gates relaxed in lockstep.** The pre-check (FOR UPDATE read) AND the
  rowcount-guarded deduction must agree on the same formula; if only one
  changed, transaction could throw on a seemingly valid approval.
- **Negative confirmed balance is intentional** and renders on the balance
  card; accrual then rebuilds it month over month.

## Gap

- PRD US-01 AC3 still says "may still submit for HR override" — the phrasing
  "HR override" is now misleading; the mechanism is a policy allowance, not
  an override. Optionally revise PRD copy in a doc commit.

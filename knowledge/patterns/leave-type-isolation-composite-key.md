# Pattern: Leave-Type Isolation via Composite Key Lookup

## Context

Balance operations must only touch the specific leave_type_id of the request — never sibling types.

## Pattern

- Decision endpoint finds balance by `user_id + leave_type_id` composite key (not just user_id)
- Balance check gate uses `leaveType.tracks_balance` — types with tracks_balance: false are exempt
- MOCK_LEAVE_POLICIES excludes Unpaid — accrual cron never creates a balance row for it

## Why

- Composite key lookup ensures approve/reject only mutates the correct balance row
- `tracks_balance: false` is the single source of truth for "this type has no balance"
- Excluding from MOCK_LEAVE_POLICIES means accrual never touches it either
- Defense-in-depth: both the balance check AND the balance mutation respect the type isolation

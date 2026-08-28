# RETRO: TASK-018 — Independent Leave-Type Balance Validation

**Date:** 2026-08-26
**Status:** Complete (2/2 AC pass)

## What went well

- Zero code changes needed — existing implementation already satisfied all ACs
- Composite key lookup (user_id + leave_type_id) in decision route is correct by design
- tracks_balance: false on Unpaid type gates the balance check in POST handler
- MOCK_LEAVE_POLICIES excludes Unpaid — accrual cron never touches it

## Notes

- This was a verification-only task — good sign that the codebase conventions are sound
- The isolation pattern is enforced at 3 levels: submit check, decision mutation, accrual

## Patterns contributed

- knowledge/patterns/leave-type-isolation-composite-key.md

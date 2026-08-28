# RETRO: TASK-014 — Approve/Reject Decision Endpoint

**Date:** 2026-08-26
**Status:** Complete (3/3 AC pass)

## What went well

- New isolated route file — zero blast radius to existing route.ts
- All helpers already existed (calculateBusinessDays, addAuditEntry, generateAuditId)
- Balance decrement finds row by user_id + leave_type_id — correct per TASK-018 (independent leave-type validation)
- 403 check redundant with scope=team filter (defense-in-depth)

## Notes

- Balance row lookup uses MOCK_BALANCES.find() — if no balance row exists (e.g. Unpaid leave), the if (balance) guard silently skips decrement. This is correct per US-08: Unpaid has no accrual policy and must never be blocked by balance check.
- Decision response returns the mutated request object — caller can use this for UI updates without a re-fetch.

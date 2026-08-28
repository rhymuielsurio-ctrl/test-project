# RETRO: TASK-017 — Monthly Accrual Cron Job

**Date:** 2026-08-26
**Status:** Complete (2/2 AC pass)

## What went well

- Idempotency solved cleanly with dedicated accrued_at field
- accrueAllBalances() helper keeps logic in mock-data.ts (single source of truth)
- Route handler is minimal — just calls the helper
- Unpaid leave correctly excluded (no policy entry)

## Notes

- Vercel Cron config (vercel.json) is deferred to deploy — not in Day 0 scope
- Initial MOCK_BALANCES.accrued_at = null — first cron run will accrue on top of seed balances
- If a user has no balance row for a policy, the `if (!balance) continue` guard skips them gracefully

## Patterns contributed

- knowledge/patterns/month-based-idempotency.md

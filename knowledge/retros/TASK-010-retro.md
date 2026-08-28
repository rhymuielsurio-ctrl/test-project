# RETRO: TASK-010 — Database Schema & Migrations

**Date:** 2026-08-26
**Status:** Complete (4/4 AC pass)

## What went well

- Migration SQL matched mock-data.ts types on first pass — schema contract was clear
- BEGIN/COMMIT transaction ensures atomicity
- Seed script uses hardcoded IDs for cross-table reference integrity

## Notes

- Migration is Supabase SQL (standard Postgres). Works with `supabase db push` or direct psql.
- Seed script requires Supabase client — not runnable without a live DB instance.
- Day 0 UI uses mock-data.ts (in-memory), not the DB. Seed is for Day 1 readiness.

## Patterns contributed

- knowledge/patterns/idempotent-seed-script.md

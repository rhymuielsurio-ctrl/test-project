# Pattern: Idempotent Seed Script with Supabase Client

## Context

Day 0 needs test data in the DB. Seed must be safe to run多次 without duplicating rows.

## Pattern

- Use `@supabase/supabase-js` client with `upsert()` + `{ onConflict: "id", ignoreDuplicates: true }`
- Hardcoded IDs (e.g. `usr-001`, `lt-vacation`) ensure deterministic references across seed runs
- Env vars: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (or `NEXT_PUBLIC_*` fallback)
- `npx tsx scripts/seed.ts` to run

## Why

- `upsert` with `ignoreDuplicates` is idempotent — safe for dev restarts
- Hardcoded IDs let seed data cross-reference (policies reference user IDs, balances reference type IDs)
- Separate from migration SQL — migration creates schema, seed populates data

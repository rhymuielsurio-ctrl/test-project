# RETRO: TASK-011 — Submit Leave Request Form + API

**Date:** 2026-08-26
**Status:** Complete (3/3 AC pass, 2 backlog items)

## What went well

- Validation union return pattern kept API route clean — no mid-flow throws
- Mock data types match DB schema exactly — Day 1 swap is import-only
- Balance check with warning (not rejection) implemented correctly per AC3

## Backlog items

1. **Manager notification on submit** (AC1) — Day 0 scope; real notification in Day 1
2. **Mobile 375px visual verification** — responsive classes in place, verify in TASK-016

## Patterns contributed

- `knowledge/patterns/mock-auth-session.md`
- `knowledge/patterns/validation-union-return.md`

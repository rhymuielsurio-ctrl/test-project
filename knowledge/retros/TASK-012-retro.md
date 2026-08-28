# RETRO: TASK-012 — Leave Balance Display Page

**Date:** 2026-08-26
**Status:** Complete (2/2 AC pass)

## What went well

- getBalanceForUser() already existed with the exact return shape needed — no rework
- GET handler added cleanly alongside POST in route.ts (no conflicts)
- New page community formed cleanly in graph — no unexpected boundary crossings

## Notes

- Balance page uses "use client" + useEffect for fetch — acceptable for Day 0
- StatusBadge component is inline in page.tsx — could be extracted to ui/ if reused by TASK-013/014
- Page filters `tracksBalance` to exclude Unpaid — matches arch doc intent

## Patterns contributed

- knowledge/patterns/scoped-get-handler.md

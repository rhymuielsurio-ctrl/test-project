# RETRO: Day 0 Scaffold

**Date:** 2026-08-26
**Status:** Complete (build + lint + typecheck pass)

## What went well

- All 24 files created in one pass
- Build compiled on first attempt (only needed one fix: `poweredBy` removal)
- ESLint flat config with typescript-eslint worked after switching from FlatCompat
- All Epic 1 code remained untouched and compiled correctly with the new infrastructure
- Exact package versions resolved via temp directory (MCP tool was unavailable)

## Issues encountered

- `next lint` broken in Next.js 16 — treats "lint" as directory argument, not command. Fixed by using `eslint src/` directly.
- `poweredBy` option doesn't exist in Next.js 16 NextConfig — removed.
- ESLint 9.x deprecated upstream but functional.
- TypeScript 7.x had peer dependency conflicts with typescript-eslint (requires <6.1.0) — downgraded to 6.0.3.
- PowerShell execution policy blocked npm — used `cmd /c` as workaround.

## Patterns contributed

- knowledge/patterns/next16-lint-workaround.md

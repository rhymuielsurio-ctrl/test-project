# Pattern: Next.js 16 `next lint` Workaround

## Context

`next lint` in Next.js 16 is broken — it treats "lint" as a directory argument instead of a command, producing `Invalid project directory provided, no such directory: .../lint`.

## Pattern

Use ESLint directly in package.json scripts:

```json
"lint": "eslint src/"
```

Instead of:

```json
"lint": "next lint"
```

## Why

- `next lint` passes "lint" as a directory argument to the underlying command
- ESLint with flat config (`eslint.config.mjs`) works directly
- CI and pre-commit hooks use the same `npm run lint` command

## Works with

- ESLint 9.x flat config
- `typescript-eslint` for TypeScript support
- `eslint-config-next` (installed but not used in flat config — use `typescript-eslint` directly)

# Server-only File-Backed Mock Persistence

## Context

Day-0 mock that keeps "database" state in in-memory TypeScript arrays
(`MOCK_LEAVE_REQUESTS`, `MOCK_BALANCES`) inside `src/lib/mock-data.ts`. Those
arrays are mutated by server route handlers (approve → decrement balance,
submit → push request) and read back by later requests.

Problem: module-level arrays reset on dev hot-reload / server restart and do
not survive across serverless instances. A user action in one request (approve
and deduct) "disappears" before the next request (read balance) — e.g.
"approving doesn't deduct leave credits."

## Key constraint — shared module is imported by a CLIENT component

`src/lib/mock-data.ts` is imported by a browser component
(`leave-request-form.tsx` uses `MOCK_LEAVE_TYPES` at runtime). Therefore it
**must not** reference `node:fs` in any way — even dynamically — because the
client bundle cannot resolve Node built-ins. Putting a persistence shim "on
module load" inside `mock-data.ts` breaks `next build`.

## Solution — isolate all fs I/O in a server-only module

1. New file `src/lib/mock-state.ts` (`import * as fs from "node:fs"`):
   - `loadMockState()` — reads `mock-state.json`, splices rows back into the
     existing arrays. Uses `target.splice(0, target.length, ...source)` to
     preserve the array **identity** that consumers already hold (they import
     the same `MOCK_LEAVE_REQUESTS` reference, so in-place replacement keeps
     those references valid).
   - `saveMockState()` — writes the arrays to `mock-state.json`.
   - Guarded idempotency flag (`hydrated`) so it loads once per process.
   - All io wrapped in `try/catch return` so a missing file (fresh start) or a
     read-only filesystem (Vercel) degrades gracefully to seed data.
2. Only **server route handlers** import `mock-state.ts`:
   `await loadMockState()` at the top of each handler (before any read),
   `await saveMockState()` after any mutation.
3. `mock-data.ts` stays 100% fs-free and client-safe.

## Lazy hydration is not free — reconcile ID counters

Loading persisted rows **after** module load means any cached "next id" counter
is stale and can collide (e.g. counter derived from seed length producing an id
that a hydrated row already holds). Fix by deriving ids from the live array at
call time instead of a cached counter:

```ts
function maxNumericSuffix(ids: string[], prefix: string): number {
  return ids.reduce((max, id) => {
    if (!id.startsWith(prefix)) return max;
    const num = Number(id.slice(prefix.length));
    return Number.isFinite(num) ? Math.max(max, num) : max;
  }, 0);
}
```

## Boundaries / caveats

- Gitignore the runtime file (`mock-state.json`).
- This is still Day-0 mock durability for a **single dev process / local disk**.
  Vercel serverless gives read-only ephemeral FS, so save/load silently no-op —
  real durability arrives on Day 1 + Supabase. Degrades gracefully, never crashes.
- Only persist what the bugs require (requests + balances). Keep the audit log
  ephemeral unless a task needs it durable.

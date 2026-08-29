# Pattern — Diagnosing opaque INTERNAL_ERROR 500s without leaking internals

Status: active · Date: 2026-08-29 · Origin: "An unexpected error occurred"
after auth landing page, root-caused to a missing `notifications` table.

## Problem

`handleApiError` maps any non-AppError throw to `INTERNAL_ERROR /
"An unexpected error occurred"` (Contract: never expose stack traces or
internal details in responses — AGENTS). That makes live-DB failures
(the common case: unapplied migration, wrong column, connection drop)
invisible to anyone who can't reach the server terminal — and the thrown
pg error (code 42P01, 42703, 08xx) is exactly what you need.

## Solution (3 complementary layers)

1. **Server-side logging at the single choke point.** In the non-AppError
   branch of `handleApiError` (src/lib/errors.ts), `console.error` the
   error.message + pg code. Zero client exposure; every route catch gets
   diagnostics for free. Client responses stay opaque per contract.
2. **Boolean-only schema probe on the public health endpoint.**
   `/api/health` runs `information_schema` EXISTS checks for the tables the
   newest feature depends on (`{ schema: { notifications, sessions } }`),
   always HTTP 200. Concrete facts (table exists?), no data, no internals —
   one curl discriminates "migration not applied" from "code bug".
3. **Benign client-side error copy.** When the feed/fetch fails, the client
   logs the raw payload to its console and toasts a non-technical
   "unavailable right now" — the alarming opaque message never reaches the
   user while the cause is captured at layers 1–2.

## Key lesson

When the migration-driving task and the live DB are loosely coupled (script
`scripts/seed.ts` applies schema; dev creds may not exist at dev time), a
schema-drift 500 is the _expected_ failure of a brand-new table. Pair every
new-table feature with (a) an existence probe on health and (b) choke-point
logging, so the first runtime failure is a 10-second diagnosis instead of a
bug hunt.

## Refinement — narrow degrade for ANCILLARY new-table features

A blanket "log and let it 500" is wrong for a feed nobody can break the
post-login experience over. Follow-up: for the notifications GET, the API
edge catches ONLY pg code 42P01 (undefined_table) and returns an empty
payload (200, same shape as success) after a server-side console.error.
Every other failure rethrows to handleApiError (loud 500 + [api] log).
Rules that keep this honest:

- The swallow lives at the API EDGE, never inside the library function
  (listNotificationsForUser stays strict for future callers).
- Match the pg code exactly ("42P01") — never catch-all, or connection /
  permission faults get masked.
- The /api/health boolean probe is what keeps the drift VISIBLE: an
  empty feed with schema.notifications:false is a healthy-looking app
  - a red health signal, not a silent lie.

## Where applied

- `src/lib/errors.ts` — logging in `handleApiError`
- `src/app/api/health/route.ts` — `tableExists()` probe
- `src/app/api/notifications/route.ts` — `isUndefinedTableError()` degrade
- `src/components/features/notifications-popover.tsx` — safe failure toast

# Retro — Unified audit activity timeline (+ form width)

**Task:** Remove per-request history listing; use a timeline UI. Also widen the
too-narrow pages (audit + new request).
**Date:** 2026-08-28

## What was done

- `audit-activity-timeline.tsx` (NEW): replaces `audit-history-list.tsx`
  (DELETED). One flat, chronological activity feed across ALL an employee's
  requests — per-request card/history listing removed. Each node:
  status-colored dot (submitted=amber, approved=emerald, rejected=destructive),
  humanized title ("Request approved", "Rejected — <reason>"), context line
  (`{leave type} · {start} — {end}`), and `actor · <locale datetime>` meta.
  Items flattened from each request's `auditEntries` + deduped synthesized
  decision node (only when `decided_by`/`decided_at` exist and no matching
  action entry is present). Exports `AuditEntry`/`AuditRequest` (props kept
  stable) — `audit/page.tsx` import updated, everything else untouched.
- Widths: audit page already fluid (`px-4 py-8 sm:px-6`); `leave-requests/new`
  widened `max-w-xl` → `max-w-3xl` (deliberate form-width cap — full-fluid
  input rows degrade readability).

## Validation

- typecheck, lint, prettier, `next build` green; grep confirms zero dangling
  `audit-history-list`/`AuditHistoryList` references.

## Patterns

- **Unified activity feed:** flatten per-entity audit entries into one
  `[(key, dotColor, title, context, meta, occurredAt)]` array, sort desc by
  timestamp, render through the shared dot-and-connector rail (flex-col rail =
  dot + `w-px flex-1` connector, `last:pb-0`). Context line carries entity
  identity so interleaving feeds stay readable.
- **Reuse over rename:** keep exported entity types on the replacing module so
  consumers change one import line, not the data contracts.

## Backlog

- `queue` page unchanged (`max-w-5xl`) — same fluid-treatment candidate.
- Format drift (36 files), ~5 uncommitted feature sets in the working tree —
  commit next.

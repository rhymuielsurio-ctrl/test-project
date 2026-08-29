# Retro — Activity timeline + fluid layout

**Task:** Maximize the page + replace the collapsible audit trail with a timeline.
**Date:** 2026-08-28

## What was done

- `audit-history-list.tsx`: per-request collapsible accordion → always-visible
  vertical timeline trail. Each Card shows leave type + StatusBadge + dates,
  then an `<ol>` with a dot-and-connector rail — one node per audit entry
  (amber "Request submitted", emerald "Approved", destructive "Rejected — <reason>"),
  actor + locale timestamp per node; a decision node is appended only when
  `decided_by`/`decided_at` exist AND no matching action entry already exists
  (dedupe); empty audit entries fall back to a synthetic "Request submitted"
  node from `created_at`. `AuditEntry`/`AuditRequest` exports and props
  unchanged — `audit/page.tsx` untouched API.
- `audit/page.tsx` + `leave-requests/page.tsx`: dropped `mx-auto max-w-5xl` for
  fluid `px-4 py-8 sm:px-6`. Balance grid now `2/3/4` columns
  (`sm/lg/xl`) to fill the wider canvas.
- Deleted `src/components/ui/collapsible.tsx` — only importer was
  audit-history-list; grep confirms zero remaining code references.

## Validation

- typecheck, lint, prettier, `next build` green.
- Graph blast-radius: Collapsible community empty; AuditHistoryList single
  consumer; Card/cn/StatusBadge additive usage only.

## Patterns

- **Dot-and-connector timeline (no positioning math):** per item use a
  `flex gap-3` row; left column is `flex flex-col items-center` holding a
  `size-3 rounded-full border-2 border-background` dot and a `w-px flex-1
bg-border` connector that only renders when `index < length - 1`
  (`last:pb-0` on the `<li>` supplies the inter-node gap). Tailwind pseudos
  not needed; safe on mobile since the rail is in normal flow.
- **Decision node dedupe:** append a synthesized decision node only when
  `!auditEntries.some(a => a.action === entry.status)` and the request carries
  `decided_by`/`decided_at` — the data layer may or may not emit decision
  entries, and this is tolerant of both.

## Backlog

- Prior retros still reference "collapsible history trail" (doc text only) —
  cosmetic, no action required.
- Format drift backlog unchanged (36 files); 4+ uncommitted feature sets now in
  the working tree — commit before next task.
- `queue` page still `max-w-5xl` — same browsing pattern as audit; candidate for
  the same fluid treatment in a future task (forms stay narrow by design).

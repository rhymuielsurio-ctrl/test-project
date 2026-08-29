# Retro — Balance page request details (requested date + rejection reason)

Date: 2026-08-29
Scope: `src/lib/leave-store.ts`, `src/app/leave-requests/page.tsx`

## What

"My requests" on the leave balance page was a bare list (leave type, status,
date range, optional reason), ordered oldest-first by `created_at`. Made it:

- **Recent first** — `ORDER BY r.created_at DESC` in `listRequestsForUser`
  (mine scope only).
- **Requested date** — `created_at` was already in the wire payload but never
  rendered; surfaced via an `Intl.DateTimeFormat` ("Apr 5, 2026").
- **Rejection reason** — now shows `Rejected: <reason>` in the destructive
  tone when `status === "rejected"`.

## Why the store change had no schema change

The rejection reason was already persisted (migration 004, `audit_log.details`
written by `decideLeaveRequest` on reject). The listing simply had to fetch it:

```sql
(SELECT al.details
   FROM audit_log al
  WHERE al.leave_request_id = r.id AND al.action = 'rejected'
  ORDER BY al.occurred_at DESC LIMIT 1) AS rejection_reason
```

Lesson: **decide where the fact lives once, then decorate reads from it** —
no new table/column needed because the audit trail is the record of record.

## Pattern notes

- **SQL owns ordering, always.** The client page does zero sorting; team queue
  and audit report intentionally keep `ASC` (oldest-first triage). "Sort
  recent first" = change the query, not the map.
- **Superset wire type:** `MyLeaveRequest extends DbLeaveRequest` adds
  `rejection_reason` without touching the base row type — everything else that
  returns `DbLeaveRequest` (create, team list, audit) stays stable.
- **Graceful gap:** rows rejected before `details` existed come back NULL and
  simply omit the line — no empty-string UI.

## Time cost

~15 min (read store query, subquery, render). No migration, no API surface.

## Backlog

- Date formatting is now duplicated (`formatTimestamp` in
  `audit-activity-timeline.tsx` vs `formatRequestedAt` in
  `leave-requests/page.tsx`). If a third site appears, extract a
  `@/lib/dates.ts`. (`date-fns` is already a dep if we want it.)

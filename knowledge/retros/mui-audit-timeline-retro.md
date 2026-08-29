# Retro — MUI Labs timeline for audit history

**Task:** MUI Labs timeline for employee audit history; modernize the audit
page with MUI; remove collapsible.
**Date:** 2026-08-29

## What was done

- Pinned @mui/material 9.4.0, @mui/lab 9.0.0-beta.9, @emotion/react 11.14.0,
  @emotion/styled 11.14.1 (npm peers verified against React 19.2.8).
- `audit-activity-timeline.tsx`: Tailwind dot-rail → MUI Labs
  `<Timeline position="right">` with `TimelineSeparator` /
  `TimelineDot color={success|error|warning|grey}` / `TimelineConnector`.
  Flattened chrono feed + deduped decision nodes preserved. Exported
  `AuditEntry` / `AuditRequest` contracts unchanged. No `CssBaseline`
  imported — Tailwind global reset stays authoritative.
- `audit/page.tsx`: shadcn Select/Card → MUI FormControl+InputLabel+Select
  (employee picker), MUI Alert (error), MUI Paper surfaces (timeline + empty
  state). Audit page becomes a scoped MUI island; every other page remains
  shadcn/Tailwind.

## Validation

- typecheck / lint / prettier / `next build` green.
- Graph blast radius (850 nodes): 1-hop edge page→timeline only; no boundary
  crossing; `dependencies` added to additively.
- Live SSR smoke (alice session): /audit HTML contains `MuiSelect` + `MuiPaper`
  - picker copy (emotion SSR works — no FOUC marker); /leave-requests still
    renders the Tailwind isle (h1 in SSR; dynamic sections hydrate client-side).

## Patterns

- **Isolated component-library island:** adopt a second UI system (MUI) on ONE
  page without a global reset (`CssBaseline`) so its typography/resets don't
  fight the tailwind preflight — depends only on emotion inject-first inserting
  per-component styles.
- **Contract-on-rename:** exporting entity types form the replacement module
  keeps consumers on a 1-line import change.

## Backlog

- `ui/select` + `ui/card` now only used by non-audit pages — keep (not orphaned).
- ~5 uncommitted feature sets in tree — commit next task.
- If MUI adoption spreads, standardize a theme (dark/light parity, font, radius)
  and reconsider CssBaseline; not needed while scoped to one page.

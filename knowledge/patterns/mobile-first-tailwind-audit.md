# Pattern: Mobile-First Tailwind Audit Checklist

## Context

When auditing mobile responsiveness, check these common patterns:

## Checklist

1. **Page wrapper**: `px-4 py-8` on the outermost `<main>` or `<div>` — prevents content touching screen edges
2. **Form inputs**: `w-full` on `<input>` and `<select>` — fills container when stacked in grid-cols-1
3. **Grid layouts**: `grid-cols-1 sm:grid-cols-2` — single column mobile, two columns desktop
4. **Buttons**: `w-full sm:w-auto` — full-width mobile, auto-width desktop
5. **Tables**: `overflow-x-auto` on wrapper — horizontal scroll instead of overflow
6. **Cards**: `flex-col sm:flex-row` — stacked mobile, inline desktop

## Why

- Tailwind `sm:` breakpoint is 640px — below that, all `sm:` utilities are inactive
- `px-4` (16px) is the minimum safe padding for 375px screens
- `w-full` on form elements prevents fixed-width inputs from causing horizontal scroll

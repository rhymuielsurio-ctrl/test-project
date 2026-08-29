# LeaveTrack Design System

Day 0 spec, reconciled to the current implementation (2026-08-28). Derived from
PRD/BRD requirements and a standard web design system (no Figma export was
available). All tokens live in `src/app/globals.css` as Tailwind v4 `@theme`
values and are consumed as Tailwind utility classes. Brand color is **hex**
(`#2563eb`); semantic tones use the `*-bg` / `*-text` pattern for soft variant
support.

> **Implementer's note:** earlier versions of this doc described tokens and
> primitives that were never built (HSL `brand-*` palette, `FormField`,
> `ui/card`, `ui/table`, `ui/skeleton`, `ui/empty-state`, `ui/error-state`,
> an `icons/index.tsx` barrel, and `shadow-*`/`radius-*` theme tokens). Those
> remain aspirational and are **not implemented** — do not code against them.
> This section lists only what actually exists.

## Color — brand (hex)

| Token           | Value     | Use                                            |
| --------------- | --------- | ---------------------------------------------- |
| `primary`       | `#2563eb` | Primary buttons, links, active nav, focus ring |
| `primary-hover` | `#1d4ed8` | Primary hover state                            |

## Color — semantic

| Token                         | Value     | Meaning                       |
| ----------------------------- | --------- | ----------------------------- |
| `success`                     | `#16a34a` | Approved / positive           |
| `success-bg` / `success-text` | tints     | Success badge / alert surface |
| `warning`                     | `#d97706` | Pending / caution             |
| `warning-bg` / `warning-text` | tints     | Warning badge / alert surface |
| `error`                       | `#dc2626` | Rejected / destructive        |
| `error-bg` / `error-text`     | tints     | Error badge / alert surface   |

Semantic tone is named `error`, **not** `danger`. Note: the `Button` component
uses a `danger` _variant_ name that maps to the `error` token.

## Neutrals

Neutrals use the Tailwind default `slate` palette (`slate-50`…`slate-900`,
e.g. `text-slate-900`, `bg-slate-100`, `border-slate-200`, `disabled:text-slate-400`).
There are no custom neutral theme tokens in `globals.css`.

## Typography

- Font family: system-ui sans stack (`--font-sans`).
- Sizes (Tailwind default scale): text-xs (12), text-sm (14), text-base (16), headings via `text-lg`–`text-3xl`.
- Weights: `font-medium` (500) for labels/buttons, `font-semibold` (600) headings.

## Spacing & radii

- Spacing: Tailwind 4px base scale (`space-y-*`, `gap-*`, `p-*`/`px-*`/`py-*`).
- Radii: Tailwind `rounded-md`/`rounded-full` utilities inline. No `--radius-*`
  theme tokens exist.

## Shadows

Shadows are applied inline with Tailwind utilities (e.g. `shadow-sm`, `shadow-lg`).
No `--shadow-card` / `--shadow-popover` theme tokens exist.

## Components

| Component | Path                             | Variants / states                                                                |
| --------- | -------------------------------- | -------------------------------------------------------------------------------- |
| Button    | `src/components/ui/button.tsx`   | primary / secondary / ghost / danger; sm/md/lg; loading spinner, disabled, focus |
| Input     | `src/components/ui/input.tsx`    | label, error (`aria-invalid`), focus, disabled                                   |
| Select    | `src/components/ui/select.tsx`   | label, focus, disabled                                                           |
| Textarea  | `src/components/ui/textarea.tsx` | label, error, focus, disabled                                                    |
| Badge     | `src/components/ui/badge.tsx`    | neutral / success / warning / error                                              |

Form primitives (`Input`, `Select`, `Textarea`) wire their own `label`/`htmlFor`
and error messaging — there is **no** `FormField` wrapper.

Tables are **feature** components, not shared primitives:
`audit-history-table.tsx` and `manager-queue-table.tsx` under
`src/components/features/`. There is no `ui/table` primitive.

## Layout

- **Mobile-first.** Critical breakpoint 375px (BR-05/US-06): no horizontal scroll.
- Global chrome is a **persistent left sidebar** (`src/components/layout/app-shell.tsx`)
  from `md` (768px) up: fixed 256px rail holding the brand, a vertical `next/link`
  row (`nav-links.tsx`), and a foot with the profile initial + LogoutButton. Below
  `md` the site keeps a slim top bar (brand + hamburger) and the nav moves into a
  left slide-in drawer (`mobile-nav.tsx`) with a session footer.
- `app-nav.tsx` hides the whole shell on public routes (`/login`).
- Page max-width: `max-w-2xl` (forms), `max-w-4xl`/`max-w-5xl` (tables).

## Iconography

Icons are **inline SVGs** rendered directly in components, using `currentColor`
and the stroke style (e.g. hamburger / close glyphs in `mobile-nav.tsx`).
There is no shared `icons/index.tsx` barrel.

## Accessibility

- Every interactive control has a visible focus ring (`focus-visible:ring-2`
  `focus-visible:ring-primary`).
- Form primitives wire `label`/`htmlFor` internally.
- `role="alert"` on errors, `aria-invalid` on fields, `aria-busy` on loading buttons.
- WCAG AA contrast maintained across the palette.

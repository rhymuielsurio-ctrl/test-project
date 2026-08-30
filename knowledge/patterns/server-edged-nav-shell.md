# Pattern: Server-Edged Nav Shell with Client-Bound Interactivity

## Context

The global navigation bar needs both **role/persona awareness** (show/hide the
Approval Queue link; render the user's initial) and **client interactivity**
(hamburger drawer, active-route highlighting via `usePathname`).

The session cookie is `httpOnly` (`src/lib/auth.ts`), so a client component
cannot read the session. Reading it in client JS would also leak the persona
into the client bundle, contrary to the PRD's "enforced server-side" rule.

## Pattern

Split the nav into a **server shell** + **client leaves**:

1. Server component (`navbar.tsx`) calls `getMockSession()` and passes only the
   resolved primitives (`role`, `name`) down as props.
2. Client components (`nav-links.tsx`, `mobile-nav.tsx`) receive those props and
   handle everything that needs hooks (`usePathname`, `useState`).

No client component imports `auth`/`cookies`; the drawer never re-derives the
session.

## Why

- Keeps the httpOnly cookie/server-only code out of the client bundle.
- Role filtering happens once, server-side, so the hidden link never reaches the
  DOM for an employee.
- `layout.tsx` stays a server component; only the leaf drawer is `"use client"`.

## Route-gating the nav shell (hide it on public routes)

The navbar also needs to disappear on public routes such as `/login` — but the
shell is a **server component** (`getMockSession` reads cookies), and `usePathname`
is a **client hook**. A client component cannot import and render a server
component directly. Solution: render the server shell as **children** of a thin
client wrapper:

```tsx
// app-nav.tsx ("use client")
export function AppNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return <>{children}</>;
}

// layout.tsx (server)
<AppNav>
  <Navbar />
</AppNav>;
```

Server-component-in-client is legal only through `children`, never via import.
This keeps `layout.tsx` a server component while still allowing route-based
show/hide.

## Mobile-first notes (BR-05/US-06)

- Desktop link row: `hidden md:flex` (hidden below 768px).
- Drawer is `fixed` and translated off-screen (`translate-x-full`) when closed —
  it contributes no width to the document, so it cannot cause horizontal
  scrollbars at 375px.

## Role-gating nav links (declarative allow-list)

Once a nav needs more than one role-specific link (e.g. manager "Approval Queue"
**and** HR Admin "Audit"), a single `managerOnly: boolean` flag stops scaling.
Generalize the link model to a **role allow-list** (`UserRole[]`; omit = visible
to all):

```ts
interface NavLink {
  href: string;
  label: string;
  roles?: UserRole[];
}

const LINKS: NavLink[] = [
  { href: "/leave-requests", label: "Leave Balance" },
  { href: "/leave-requests/new", label: "New Request" },
  { href: "/leave-requests/queue", label: "Approval Queue", roles: ["manager"] },
  { href: "/audit", label: "Audit", roles: ["hr_admin"] },
];

const visible = LINKS.filter((l) => !l.roles || l.roles.includes(role));
```

Because `navbar.tsx` (desktop) and `mobile-nav.tsx` (drawer) both render the
same `NavLinks` with the server-passed `role`, one declarative array gates every
surface. Important: the nav link controls **visibility only** — authorization
still lives server-side in the route handler (`requireAuth([...])`), so a
non-permitted user who navigates directly is still rejected.

## Data depth: use the server edge for live rosters too (audit page, 2026-08-29)

The same server-edge/client-leaf split applies to PAGES that need LIVE data:
the audit page originally rendered its employee dropdown from the STATIC
`MOCK_USERS` array ("mirrors the seeded DB"), so every user created via
register was invisible to HR audit — and the timeline resolved actor names
("Decided by …") from the same stale mirror. Fix (apply it as a rule):

- Server page (`force-dynamic`, `getMockSession` role-checks + `redirect`)
  queries the DB (`listUsersForAudit`) and passes plain `{ id, name }[]` down.
- Client leaf builds the dropdown AND the name→label map for the timeline from
  that single prop. No client-side re-fetch, no duplicated query.
- Lesson: any "mirror of the DB" kept as a dev constant rots the moment writes
  (register, manager reassignment) exist. If the page renders data that can
  be written at runtime, pull it from the same store the writes go to — a
  static mirror is only safe on Day 0 with no write paths.

## Role writes take effect immediately because roles live in the DB (2026-08-30)

`getMockSession()` does NOT bake the role into the cookie — it JOINs `users`
per request and reads `u.role` live (`src/lib/auth.ts`). Consequence for the
HR "promote to manager" control: a role UPDATE is visible to the promoted
member on their very next request (nav re-renders, new Approval Queue link,
server `requireAuth(["manager"])` passes) with NO re-login and NO session-
store touch. The cookie only proves identity; the DB is the source of truth
for authorization. So a role-mutation feature is just data + a gated route:
`promoteEmployee` (single `UPDATE users SET role`, guard role === 'employee'
first) + `requireAuth(["hr_admin"])` endpoint + an optimistic client row
update. When adding any future role feature, push the role check into the
query/guard server-side and let the per-request JOIN do the freshness work.

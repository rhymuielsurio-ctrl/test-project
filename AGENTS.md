# LeaveTrack v1.0

Leave management system — Next.js 16 (App Router) + TypeScript + Tailwind v4 + Supabase Postgres.

## Stack

- **Framework:** Next.js 16 (App Router, proxy.ts route guard)
- **Language:** TypeScript 6.x (strict mode)
- **Styling:** Tailwind CSS v4
- **Database:** Supabase Postgres
- **Auth:** Mock cookie session (Day 0) → Supabase Auth (Day 1)
- **Deployment:** Vercel (app) + Supabase (managed Postgres)

## Project Structure

```
src/
  app/
    api/               # API routes (Next.js Route Handlers)
      auth/login/      # Mock login — sets session cookie
      auth/logout/     # Mock logout — clears session cookie
      health/          # Health check endpoint
      leave-requests/  # Leave request CRUD + team scope
      audit/[userId]/  # HR audit report
      jobs/accrual/    # Monthly accrual cron job
    leave-requests/    # Balance display page
      new/             # Submit leave request page
    login/             # Mock login page
    layout.tsx         # Root layout
    page.tsx           # Redirects to /leave-requests
    globals.css        # Tailwind v4 + theme tokens
  components/
    features/          # Feature-specific components
    layout/            # Layout components
    ui/                # Reusable UI primitives
  lib/
    auth.ts            # Mock session helpers
    errors.ts          # AppError + error response format
    mock-data.ts       # Typed mock data + DB interfaces
    validators.ts      # Input validation (union return pattern)
proxy.ts               # Route guard (reads mock-session cookie)
```

## Coding Standards

- **TypeScript:** Strict mode. No `any`. Use `unknown` for catch clauses.
- **Error format:** `{ success: false, error: { code, message } }` — use `AppError` class.
- **Validation:** Union return pattern `{ valid: true, data } | { valid: false, error }`.
- **Imports:** Use `@/lib/*` path alias. Never relative imports for lib modules.
- **Components:** Functional components with TypeScript props. Use `forwardRef` for form elements.
- **Styling:** Tailwind v4 utility classes. Mobile-first responsive design.
- **Naming:** `PascalCase` for components and types. `camelCase` for functions and variables. `kebab-case` for files.

## Security Rules

- **Day 0 mock auth:** Login accepts any input. `AGENTS.md` must flag this explicitly.
- **Session cookie:** httpOnly, secure (production), 8h expiry, SameSite Lax.
- **Route guard:** `proxy.ts` — not `middleware.ts`. Redirects to `/login` if no session.
- **API auth:** Every endpoint calls `requireAuth()`. Role-gated access enforced server-side.
- **Error responses:** Never expose stack traces or internal details.
- **No secrets in code:** All env vars in `.env.example` with placeholder values.

## Git Conventions

- **Commit messages:** Conventional Commits format (`feat:`, `fix:`, `chore:`, etc.)
- **Branch naming:** `feat/`, `fix/`, `chore/` prefixes.
- **Pre-commit hooks:** husky + lint-staged (lint + format on staged files).
- **PR workflow:** Squash merge to main. Review required.

## Quality Gates

- `npm run lint` — ESLint must pass
- `npm run typecheck` — TypeScript must compile with no errors
- `npm run build` — Next.js build must succeed
- `npm run format:check` — Prettier formatting must be consistent

## Day 0 Boundaries

- **Auth:** Mock cookie session only. No real provider.
- **Data:** Mock data arrays in `src/lib/mock-data.ts`. No live DB queries.
- **External services:** None. Project builds and runs without credentials.
- **Business logic:** Fully implemented in Epic 1 (TASK-010 through TASK-018).

## Known Issues

- ESLint 9.x is marked deprecated upstream but functional.
- TypeScript 6.x peer dependency conflict with typescript-eslint (overrides applied).
- `scripts/seed.ts` requires Supabase credentials — only runs on Day 1+.

# Coding Standards

## TypeScript

- Strict mode enabled in tsconfig.json
- No `any` — use `unknown` for catch clauses, narrow with type guards
- Prefer `interface` for object shapes, `type` for unions/intersections
- Use `readonly` for immutability where appropriate
- Path alias: `@/*` maps to `./src/*`

## Error Handling

- Use `AppError` class from `src/lib/errors.ts`
- Error response format: `{ success: false, error: { code, message } }`
- Use `handleApiError()` as the catch handler in all API routes
- Never expose stack traces or internal details to the client

## Validation

- Union return pattern: `{ valid: true, data } | { valid: false, error }`
- Validate at the API boundary, not in components
- Use `AppError` for validation errors with code `VALIDATION_ERROR`

## Components

- Functional components with TypeScript props interface
- Use `forwardRef` for form elements (Input, Select, Button)
- Name files in kebab-case: `leave-request-form.tsx`
- Export named components, not default exports (except pages)

## Styling

- Tailwind v4 utility classes
- Mobile-first responsive design (375px+ base)
- Use `@theme` block in globals.css for design tokens
- No inline styles — always Tailwind classes

## Imports

- Use `@/lib/*` path alias for lib modules
- Never use relative imports for `@/lib/*` modules
- Group imports: external packages first, then `@/` aliases, then relative

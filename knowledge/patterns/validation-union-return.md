# Pattern: Server-Side Validation with Discriminated Union Return

## Context

API routes need consistent validation that returns either typed data or a typed error,
without throwing mid-validation.

## Pattern

```typescript
function validate(
  input: unknown,
): { valid: true; data: TypedOutput } | { valid: false; error: AppError };
```

- Each check returns early with `AppError("VALIDATION_ERROR", message)`
- Caller checks `validation.valid` — no try/catch for validation flow
- `handleApiError()` normalizes all errors to `{ success, error: { code, message } }`
- Business days calculated during validation (not duplicated in caller)

## Why

- Validation never throws — clean control flow
- Caller gets typed data on success, typed error on failure
- Error format enforced at one place (errors.ts)

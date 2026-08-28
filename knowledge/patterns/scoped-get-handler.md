# Pattern: Scoped GET Handler with Balance Aggregation

## Context

API route needs to serve filtered data based on query param scope, plus aggregated balance info.

## Pattern

```ts
export async function GET(request: NextRequest) {
  const session = await requireAuth(["employee"]);
  const scope = request.nextUrl.searchParams.get("scope");
  if (scope !== "mine") throw new AppError("VALIDATION_ERROR", "...");
  // filter + aggregate
}
```

- Always validate scope early and reject unknown values
- Use existing data helpers (e.g. `getBalanceForUser()`) — don't recompute inline
- Return `{ success: true, data: { ... } }` per error format ADR

## Why

- Scope validation prevents accidental data leakage (team scope comes later)
- Reusing existing helpers keeps business logic in one place

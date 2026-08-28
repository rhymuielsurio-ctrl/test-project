# Pattern: Role-Gated Scope Branching in API Routes

## Context

Single API endpoint serves multiple roles with different data access patterns. Need role check inside scope branch, not just at requireAuth level.

## Pattern

```ts
const session = await requireAuth(["employee", "manager"]); // both roles allowed in

if (scope === "mine") {
  /* employee logic — no extra role check */
}
if (scope === "team") {
  if (session.role !== "manager") throw new AppError("FORBIDDEN", "...", 403);
  // manager-only logic
}
```

- `requireAuth` gates entry to the endpoint (both roles can call GET)
- Inner `role !== "manager"` check gates the team scope branch specifically
- This is defense-in-depth: requireAuth prevents unauthenticated access, inner check prevents employee from accessing manager data

## Why

- If requireAuth only allowed "manager", employees couldn't call `?scope=mine` at all
- If requireAuth allowed both but no inner check, employees could access `?scope=team` data
- The arch doc says: filter WHERE manager_id = :current_user_id in query — the inner check enforces this at the handler level before the query runs

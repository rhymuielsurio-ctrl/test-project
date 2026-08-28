# Pattern: Enriched Join in Mock Data

## Context

API needs to join two in-memory arrays (e.g. leave requests + audit log) and return an enriched response. No real DB join available in Day 0.

## Pattern

```ts
const results = MOCK_PRIMARY.filter((r) => r.user_id === userId && !r.is_deleted).map((r) => ({
  ...r,
  relatedEntries: MOCK_SECONDARY.filter((s) => s.foreign_key === r.id),
}));
```

- Filter primary array first (reduces iterations on secondary)
- Map to a shaped response object (not the raw DbLeaveRequest — avoids leaking internal fields)
- No helper function needed for simple joins — inline is clearer in Day 0

## Why

- In-memory join is O(n*m) but both arrays are tiny in Day 0
- Shaping the response in the handler keeps the API contract explicit
- If the join grows complex, extract to mock-data.ts as a helper

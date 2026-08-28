# Pattern: Month-Based Idempotency via Accrued-At Field

## Context

Cron job must be idempotent within a calendar month. Running twice must not double-accrue.

## Pattern

```ts
interface Balance {
  balance: number;
  accrued_at: string | null;
}

function accrue(): void {
  const currentMonth = now.toISOString().slice(0, 7); // "2026-08"
  for (const policy of policies) {
    const balance = balances.find(...);
    const lastMonth = balance.accrued_at?.slice(0, 7) ?? null;
    if (lastMonth !== currentMonth) {
      balance.balance += policy.amount;
      balance.accrued_at = now.toISOString();
    }
  }
}
```

- `accrued_at` is separate from `updated_at` (which is mutated by other operations like approve/reject)
- `accrued_at = null` means "never accrued" — first run will always accrue
- Month comparison via `slice(0, 7)` handles year boundaries correctly

## Why

- `updated_at` can't be used for accrual tracking — it's mutated by TASK-014 decision endpoint
- Dedicated `accrued_at` field isolates accrual tracking from other balance mutations
- Null initial value is safe: first cron run sets it, subsequent runs skip

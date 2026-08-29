# Pattern — Keep auxiliary writes out of the core transaction

Status: active · Date: 2026-08-29 · Origin: over-balance leave filings 500'd
with INTERNAL_ERROR because the split-notification insert shared the
submission transaction and hit a missing (not-yet-migrated) table.

## The trap

It feels atomic and tidy to write every side effect in one BEGIN…COMMIT.
But an AUXILIARY channel (notification feed, external webhook, audit
telemetry a feature doesn't own) aborts the CORE operation when its own
write fails — a missing table, a constraint, a permission — because one
shared transaction means one commit point for everything.

## The constraint that makes catch-and-continue impossible

Postgres does not let you ignore one failed statement inside a txn: the
transaction enters aborted state (SQLSTATE 25P02, "current transaction is
aborted, commands ignored until end of transaction block"). A try/catch
around the insert that then "continues" with more queries on the SAME
client hits 25P02 on every later statement — so you can't swallow inline.
Your options are SAVEPOINT/RELEASE or a different connection.

## The fix (used here)

1. Keep the transaction tight: core rows only (leave_requests + audit_log),
   COMMIT, then ROLLBACK only on core failure.
2. Run the auxiliary write AFTER COMMIT on its OWN pooled connection
   (autocommit, no txn state to poison) inside try/catch.
3. Never let the auxiliary path throw: log to the server console
   (`[leave] split notification skipped (best-effort):`) and continue.
   The submit still returns success + its warning payload.
4. If the table legitimately doesn't exist yet (migration pending), the
   separate /api/health boolean probe keeps the drift visible instead of
   the app silently pretending the feed exists.

Apply the rule of thumb: a side effect that is _not_ needed to make the
request's answer correct belongs post-commit, best-effort, and loud in the
logs only.

## When it's wrong

When notification delivery is itself a correctness guarantee (e.g. a
compliance audit record the request must not be able to exist without) —
then keep it in-txn and let the whole operation fail loudly.

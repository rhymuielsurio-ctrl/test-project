/**
 * Destructive local reset: drops the entire public schema (including the
 * schema_migrations ledger) so the next db:migrate re-applies all migrations
 * from scratch, then re-seeds dev accounts.
 * Run via: npm run db:reset  (chained to db:migrate + seed)
 * Requires DATABASE_URL env var (plain Postgres).
 */

import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

async function reset(): Promise<void> {
  const pool = new Pool({ connectionString: DATABASE_URL });
  try {
    await pool.query("DROP SCHEMA public CASCADE");
    await pool.query("CREATE SCHEMA public");
    console.log("Dropped and recreated public schema (all data removed).");
  } finally {
    await pool.end();
  }
}

reset().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});

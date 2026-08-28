/**
 * Idempotent migration runner for plain Postgres.
 * Applies supabase/migrations/*.sql in filename order against DATABASE_URL,
 * tracking applied files in a schema_migrations ledger table.
 *
 * Usage: npm run db:migrate
 * Requires DATABASE_URL env var (plain Postgres).
 */

import { readdir, readFile } from "fs/promises";
import { resolve } from "path";
import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const MIGRATIONS_DIR = resolve(process.cwd(), "supabase", "migrations");

async function migrate(): Promise<void> {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id         text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const applied = new Set(
      (await client.query<{ id: string }>("SELECT id FROM schema_migrations")).rows.map(
        (row) => row.id,
      ),
    );

    const files = (await readdir(MIGRATIONS_DIR)).filter((name) => name.endsWith(".sql")).sort();

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`Skipping ${file} (already applied)`);
        continue;
      }

      const sql = await readFile(resolve(MIGRATIONS_DIR, file), "utf8");

      await client.query("BEGIN");
      try {
        await client.query("INSERT INTO schema_migrations (id) VALUES ($1)", [file]);
        await client.query(sql);
        await client.query("COMMIT");
        console.log(`Applied ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

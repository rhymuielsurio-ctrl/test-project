import { Pool } from "pg";

export const dbUrl = process.env.DATABASE_URL;

export function createPool(): Pool {
  if (!dbUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  return new Pool({ connectionString: dbUrl, max: 4 });
}

export async function canConnect(pool: Pool): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

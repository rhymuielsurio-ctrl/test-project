import { Pool } from "pg";

const globalForPool = globalThis as unknown as {
  __leavetrack_pool?: Pool;
};

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool(): Pool {
  if (!globalForPool.__leavetrack_pool) {
    globalForPool.__leavetrack_pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
    });
  }
  return globalForPool.__leavetrack_pool;
}

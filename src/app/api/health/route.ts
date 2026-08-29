import { getPool, isDatabaseConfigured } from "@/lib/db";

async function tableExists(table: string): Promise<boolean> {
  try {
    const pool = getPool();
    const { rows } = await pool.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = $1
       ) AS "exists"`,
      [table],
    );
    return rows[0]?.exists ?? false;
  } catch {
    return false;
  }
}

export async function GET() {
  const schema = isDatabaseConfigured()
    ? { notifications: await tableExists("notifications"), sessions: await tableExists("sessions") }
    : { notifications: false, sessions: false };

  return Response.json(
    { status: "ok", timestamp: new Date().toISOString(), schema },
    { status: 200 },
  );
}

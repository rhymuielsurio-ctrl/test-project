/**
 * Offline monthly accrual job — no HTTP/server required.
 *
 * Runs the same Postgres-backed accrual the /api/jobs/accrual endpoint uses
 * (src/lib/leave-store.ts accrueBalances): updates leave_balances from
 * leave_policies, guarded by accrued_at so a re-run within the same month is a
 * no-op. Scheduled as the LeaveTrackAccrual Windows task on the 1st.
 *
 * Usage: node node_modules/tsx/dist/cli.mjs scripts/accrual-job.ts
 *        (scheduled as the LeaveTrackAccrual Windows task on the 1st)
 * Resolves DATABASE_URL from the repo .env when not already exported.
 */

import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { accrueBalances } from "../src/lib/leave-store";

process.chdir(join(dirname(fileURLToPath(import.meta.url)), ".."));

function loadEnvIfNeeded(): void {
  if (process.env.DATABASE_URL) return;
  try {
    const raw = readFileSync(join(process.cwd(), ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.trimStart().startsWith("#")) continue;
      const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
      if (match && !(match[1] in process.env)) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // No .env present — rely on the ambient DATABASE_URL.
  }
}

function currentMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function run(): Promise<void> {
  loadEnvIfNeeded();

  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL");
  }

  const month = currentMonth();
  const accrued = await accrueBalances();

  if (accrued === 0) {
    console.log(`Already accrued for ${month} — skipped`);
  } else {
    console.log(`Accrued ${accrued} balance(s) for ${month}`);
  }
}

run().catch((err) => {
  console.error("Accrual job failed:", err);
  process.exit(1);
});

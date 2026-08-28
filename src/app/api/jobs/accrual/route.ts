import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { accrueBalances } from "@/lib/leave-store";

function secretMatches(authHeader: string | null, secret: string): boolean {
  if (!authHeader) return false;
  const expected = createHash("sha256").update(`Bearer ${secret}`).digest();
  const received = createHash("sha256").update(authHeader).digest();
  return timingSafeEqual(expected, received);
}
export async function GET(request: NextRequest) {
  return runAccrual(request);
}

export async function POST(request: NextRequest) {
  return runAccrual(request);
}

async function runAccrual(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");

    const isCronCall = cronSecret !== undefined && secretMatches(authHeader, cronSecret);

    if (!isCronCall) {
      await requireAuth(["hr_admin"]);
    }

    const accruedCount = await accrueBalances();

    return Response.json(
      { success: true, data: { processed: true, accruedCount } },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

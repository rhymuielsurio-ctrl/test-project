import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { accrueBalances } from "@/lib/leave-store";

export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");

    const isCronCall = Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;

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

import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { accrueAllBalances } from "@/lib/mock-data";
import { loadMockState, saveMockState } from "@/lib/mock-state";

export async function POST() {
  try {
    await requireAuth(["hr_admin"]);

    await loadMockState();
    accrueAllBalances();
    await saveMockState();

    return Response.json({ success: true, data: { processed: true } }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

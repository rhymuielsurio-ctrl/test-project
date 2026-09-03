import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { countTeamPendingRequests } from "@/lib/leave-store";

export async function GET() {
  try {
    const session = await requireAuth(["manager"]);
    const count = await countTeamPendingRequests(session.userId);
    return Response.json({ success: true, data: { count } }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

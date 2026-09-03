import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { markAllNotificationsRead } from "@/lib/leave-store";

export async function POST() {
  try {
    const session = await requireAuth();
    const cleared = await markAllNotificationsRead(session.userId);
    return Response.json({ success: true, data: { cleared } }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

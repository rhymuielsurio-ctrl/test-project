import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { listNotificationsForUser } from "@/lib/leave-store";

function isUndefinedTableError(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && (error as { code?: string }).code === "42P01"
  );
}

export async function GET() {
  try {
    const session = await requireAuth();

    let notifications: Awaited<ReturnType<typeof listNotificationsForUser>>;
    try {
      notifications = await listNotificationsForUser(session.userId);
    } catch (error) {
      if (!isUndefinedTableError(error)) {
        throw error;
      }
      console.error(
        "[api] notifications table missing (apply migration 005); serving empty feed:",
        error,
      );
      return Response.json({ success: true, data: { items: [], unreadCount: 0 } }, { status: 200 });
    }

    return Response.json(
      {
        success: true,
        data: { items: notifications.items, unreadCount: notifications.unreadCount },
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

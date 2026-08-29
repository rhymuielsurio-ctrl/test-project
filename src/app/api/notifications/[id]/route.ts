import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { markNotificationRead } from "@/lib/leave-store";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    await markNotificationRead(id, session.userId);

    return Response.json({ success: true, data: { id } }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

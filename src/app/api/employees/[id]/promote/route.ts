import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { promoteEmployee } from "@/lib/leave-store";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(["hr_admin"]);
    const { id } = await params;

    const promoted = await promoteEmployee(id);

    return Response.json(
      { success: true, data: { id: promoted.id, role: promoted.role } },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

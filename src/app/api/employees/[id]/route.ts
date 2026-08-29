import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AppError, handleApiError } from "@/lib/errors";
import { updateEmployeeManager } from "@/lib/leave-store";

interface PatchBody {
  managerId?: string | null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(["hr_admin"]);
    const { id } = await params;

    let body: PatchBody;
    try {
      body = await request.json();
    } catch {
      throw new AppError("VALIDATION_ERROR", "Invalid JSON body");
    }

    if (body.managerId !== null && typeof body.managerId !== "string") {
      throw new AppError("VALIDATION_ERROR", "managerId must be a string or null");
    }

    await updateEmployeeManager(id, body.managerId ?? null);

    return Response.json({ success: true, data: { id } }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

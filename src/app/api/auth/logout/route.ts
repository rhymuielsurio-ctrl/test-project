import { cookies } from "next/headers";
import { deleteSessionByToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { isDatabaseConfigured } from "@/lib/db";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token && isDatabaseConfigured()) {
      await deleteSessionByToken(token);
    }

    cookieStore.delete(SESSION_COOKIE_NAME);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

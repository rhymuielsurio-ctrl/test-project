export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function errorResponse(code: string, message: string, statusCode = 400): Response {
  return Response.json({ success: false, error: { code, message } }, { status: statusCode });
}

export function handleApiError(error: unknown): Response {
  if (error instanceof AppError) {
    return errorResponse(error.code, error.message, error.statusCode);
  }
  if (error instanceof Error) {
    console.error("[api] unexpected error:", error.message, {
      code: (error as Error & { code?: string }).code,
    });
  } else {
    console.error("[api] unexpected error:", error);
  }
  return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
}

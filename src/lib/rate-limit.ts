import { NextRequest } from "next/server";
import { AppError } from "@/lib/errors";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 20;
const MAX_BUCKETS = 10_000;

interface RateEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateEntry>();

function pruneExpired(): void {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}

export function checkRateLimit(request: NextRequest, route: string): void {
  const key = `${clientIp(request)}:${route}`;
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    if (buckets.size > MAX_BUCKETS) {
      pruneExpired();
    }
    return;
  }

  entry.count += 1;
  if (entry.count > MAX_REQUESTS) {
    throw new AppError("RATE_LIMITED", "Too many attempts. Please try again later.", 429);
  }
}

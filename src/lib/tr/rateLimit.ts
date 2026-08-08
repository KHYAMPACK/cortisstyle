/**
 * Lightweight in-memory rate limiter for serverless Node routes.
 * Per-isolate only (Vercel instances don't share memory) — still stops
 * casual abuse and burst spam from a single edge instance.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const MAX_BUCKETS = 5_000;

function prune(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  if (buckets.size < MAX_BUCKETS) return;
  // Drop oldest half if still oversized
  const entries = [...buckets.entries()].sort(
    (a, b) => a[1].resetAt - b[1].resetAt,
  );
  for (const [key] of entries.slice(0, Math.floor(entries.length / 2))) {
    buckets.delete(key);
  }
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

export function consumeRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  prune(now);

  const existing = buckets.get(input.key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(input.key, {
      count: 1,
      resetAt: now + input.windowMs,
    });
    return { ok: true, remaining: input.limit - 1 };
  }

  if (existing.count >= input.limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { ok: true, remaining: input.limit - existing.count };
}

/** Best-effort client IP from common proxy headers. */
export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 64);
  return "unknown";
}

export function rateLimitResponse(retryAfterSec: number): Response {
  return Response.json(
    {
      error: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin.",
      retryAfterSec,
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    },
  );
}

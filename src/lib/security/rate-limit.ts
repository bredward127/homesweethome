/**
 * Rate limiting for public endpoints.
 *
 * Backed by an in-process map. That is sufficient for a single instance and
 * for development, but it does NOT hold across serverless instances — on
 * Vercel each cold start gets its own map, so a determined attacker spreading
 * requests across instances sees a higher effective limit.
 *
 * Before launch this should be swapped for a shared store (Upstash Redis,
 * Vercel KV, or a Postgres table with a TTL). The interface below is
 * deliberately narrow so that swap touches this file only.
 * See LAUNCH_CHECKLIST.md.
 */

type Bucket = {
  count: number;
  /** Epoch ms at which the window resets. */
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

/** Drop expired buckets so the map cannot grow without bound. */
function sweep(now: number) {
  if (buckets.size < 1000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** Seconds until the window resets. */
  retryAfterSeconds: number;
};

export type RateLimitOptions = {
  /** Maximum requests permitted per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

/**
 * Consume one unit against `key`. Returns whether the request may proceed.
 *
 * `now` is injectable so the behaviour can be tested without waiting.
 */
export function rateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
  now: number = Date.now(),
): RateLimitResult {
  sweep(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    retryAfterSeconds: 0,
  };
}

/** Clear all buckets. Test helper. */
export function resetRateLimits() {
  buckets.clear();
}

/**
 * Lead submission limits. Deliberately generous relative to real human
 * behaviour — a household discussing two properties must not be blocked —
 * while still stopping automated flooding.
 */
export const LEAD_SUBMISSION_LIMIT: RateLimitOptions = {
  limit: 5,
  windowMs: 10 * 60 * 1000,
};

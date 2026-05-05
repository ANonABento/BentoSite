/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * Caveats:
 *   - Per-process: in serverless deploys (e.g. Vercel) state is per-instance,
 *     so an attacker spreading load across many cold starts can exceed limits.
 *     For a portfolio with no persistent backend this is an acceptable tradeoff
 *     vs. the cost of pulling in Redis. Replace with Upstash/Vercel KV if abuse
 *     is observed.
 *   - Memory bound: timestamps are pruned on every check, and idle keys are
 *     evicted by `MAX_KEYS` to prevent unbounded growth.
 */

const MAX_KEYS = 10_000;

interface Bucket {
  hits: number[];
}

const buckets: Map<string, Bucket> = new Map();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
}

export interface RateLimitOptions {
  /** Maximum requests per window. */
  limit: number;
  /** Sliding window length in ms. */
  windowMs: number;
  /** Optional clock for tests. */
  now?: () => number;
}

export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = (opts.now ?? Date.now)();
  const cutoff = now - opts.windowMs;

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { hits: [] };
    if (buckets.size >= MAX_KEYS) {
      // Drop the oldest key (insertion order in JS Map).
      const oldest = buckets.keys().next().value;
      if (oldest !== undefined) buckets.delete(oldest);
    }
    buckets.set(key, bucket);
  }

  // Drop hits outside the sliding window.
  while (bucket.hits.length > 0 && bucket.hits[0] <= cutoff) {
    bucket.hits.shift();
  }

  if (bucket.hits.length >= opts.limit) {
    const retryAfterMs = bucket.hits[0] + opts.windowMs - now;
    return { ok: false, remaining: 0, retryAfterMs: Math.max(retryAfterMs, 0) };
  }

  bucket.hits.push(now);
  return { ok: true, remaining: opts.limit - bucket.hits.length, retryAfterMs: 0 };
}

/**
 * Best-effort client identifier. `request.ip` is unavailable on Next.js Edge
 * runtime and varies across hosts, so we fall back to common forwarded
 * headers. Trust assumes the deploy sits behind a proxy that strips inbound
 * `x-forwarded-for` (Vercel does this).
 */
export function getClientKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

/** Test helper — clears all buckets. Not exported from index. */
export function __resetRateLimit(): void {
  buckets.clear();
}

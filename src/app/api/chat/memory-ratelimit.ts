/**
 * Per-instance sliding-window rate limiter, used only when Upstash is not
 * configured.
 *
 * Be clear about what this is worth. On serverless each instance keeps its own
 * counters, instances are ephemeral, and a flood spread across many IPs or many
 * cold starts will not be fully caught. It is **not** a replacement for the
 * Upstash limiter — it is the difference between "a public endpoint that calls
 * a paid model with no ceiling at all" and "one that stops a naive flood from a
 * single client hitting a warm instance". When both Upstash variables are set,
 * this code does not run.
 */

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Epoch ms at which the caller may retry. */
  reset: number;
}

export interface MemoryRateLimiterOptions {
  requests: number;
  windowMs: number;
  /** Cap on tracked clients, so a spray of unique IPs cannot grow the map without bound. */
  maxTrackedClients?: number;
  /** Test seam. */
  now?: () => number;
}

export interface MemoryRateLimiter {
  limit: (key: string) => RateLimitResult;
}

const DEFAULT_MAX_TRACKED_CLIENTS = 5000;

export function createMemoryRateLimiter({
  requests,
  windowMs,
  maxTrackedClients = DEFAULT_MAX_TRACKED_CLIENTS,
  now = Date.now,
}: MemoryRateLimiterOptions): MemoryRateLimiter {
  // key -> timestamps of hits inside the window, oldest first.
  const hits = new Map<string, number[]>();

  function evictIfOversized(cutoff: number): void {
    if (hits.size <= maxTrackedClients) return;

    // Drop clients whose whole window has expired first — they cost nothing.
    for (const [key, timestamps] of hits) {
      if (timestamps.length === 0 || timestamps[timestamps.length - 1] <= cutoff) {
        hits.delete(key);
      }
    }

    // Still oversized: drop least-recently-inserted. Map preserves insertion
    // order, so this is the oldest entry. Note the tradeoff — an attacker
    // spraying unique keys can push a real client out and reset its window.
    // Bounded memory matters more here than a perfect window.
    while (hits.size > maxTrackedClients) {
      const oldest = hits.keys().next();
      if (oldest.done) break;
      hits.delete(oldest.value);
    }
  }

  return {
    limit(key: string): RateLimitResult {
      const timestamp = now();
      const cutoff = timestamp - windowMs;

      const previous = hits.get(key) ?? [];
      const recent = previous.filter((entry) => entry > cutoff);

      if (recent.length >= requests) {
        hits.set(key, recent);
        return {
          success: false,
          limit: requests,
          remaining: 0,
          // The window frees a slot when its oldest hit ages out.
          reset: recent[0] + windowMs,
        };
      }

      recent.push(timestamp);
      hits.set(key, recent);
      evictIfOversized(cutoff);

      return {
        success: true,
        limit: requests,
        remaining: requests - recent.length,
        reset: timestamp + windowMs,
      };
    },
  };
}

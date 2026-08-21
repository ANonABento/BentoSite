import { describe, expect, it } from 'vitest';
import { createMemoryRateLimiter } from './memory-ratelimit';

/**
 * `/api/chat` calls a paid model. With Upstash unconfigured the route used to
 * serve completely unthrottled, so a scripted client could run the bill up
 * without limit. This limiter is the floor under that case.
 */

function fixedClock(start = 1_000_000) {
  let current = start;
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
  };
}

describe('createMemoryRateLimiter', () => {
  it('allows up to the limit and blocks the request after it', () => {
    const clock = fixedClock();
    const limiter = createMemoryRateLimiter({ requests: 3, windowMs: 60_000, now: clock.now });

    expect(limiter.limit('ip').remaining).toBe(2);
    expect(limiter.limit('ip').remaining).toBe(1);
    expect(limiter.limit('ip').remaining).toBe(0);

    const blocked = limiter.limit('ip');
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('frees a slot once the oldest hit ages out of the window', () => {
    const clock = fixedClock();
    const limiter = createMemoryRateLimiter({ requests: 2, windowMs: 60_000, now: clock.now });

    limiter.limit('ip');
    clock.advance(30_000);
    limiter.limit('ip');
    expect(limiter.limit('ip').success).toBe(false);

    // The first hit is now 61s old; the second is still inside the window.
    clock.advance(31_000);
    expect(limiter.limit('ip').success).toBe(true);
    expect(limiter.limit('ip').success).toBe(false);
  });

  it('reports when the caller may retry, so the route can send Retry-After', () => {
    const clock = fixedClock();
    const limiter = createMemoryRateLimiter({ requests: 1, windowMs: 60_000, now: clock.now });

    const first = limiter.limit('ip');
    clock.advance(10_000);
    const blocked = limiter.limit('ip');

    expect(blocked.success).toBe(false);
    // Retry when the first hit ages out, not a fresh window from now.
    expect(blocked.reset).toBe(first.reset);
  });

  it('counts each client separately', () => {
    const clock = fixedClock();
    const limiter = createMemoryRateLimiter({ requests: 1, windowMs: 60_000, now: clock.now });

    expect(limiter.limit('a').success).toBe(true);
    expect(limiter.limit('b').success).toBe(true);
    expect(limiter.limit('a').success).toBe(false);
  });

  it('bounds memory when sprayed with unique clients', () => {
    const clock = fixedClock();
    const limiter = createMemoryRateLimiter({
      requests: 5,
      windowMs: 60_000,
      maxTrackedClients: 10,
      now: clock.now,
    });

    for (let index = 0; index < 500; index += 1) {
      limiter.limit(`ip-${index}`);
    }

    // The most recent client must still be tracked — eviction drops the oldest,
    // never the caller currently being counted.
    expect(limiter.limit('ip-499').remaining).toBe(3);

    // And the oldest must actually be gone: a forgotten client starts a fresh
    // window (remaining 4), where a still-tracked one would report 3. Without
    // this the test would pass with eviction removed entirely.
    expect(limiter.limit('ip-0').remaining).toBe(4);
  });
});

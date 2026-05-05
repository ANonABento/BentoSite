import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, getClientKey, __resetRateLimit } from '../rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    __resetRateLimit();
  });

  it('allows requests under the limit', () => {
    let now = 1_000_000;
    const clock = () => now;
    const opts = { limit: 3, windowMs: 1000, now: clock };

    expect(rateLimit('a', opts).ok).toBe(true);
    now += 100;
    expect(rateLimit('a', opts).ok).toBe(true);
    now += 100;
    const third = rateLimit('a', opts);
    expect(third.ok).toBe(true);
    expect(third.remaining).toBe(0);
  });

  it('blocks requests once the limit is reached and returns retry-after', () => {
    const now = 1_000_000;
    const clock = () => now;
    const opts = { limit: 2, windowMs: 1000, now: clock };

    rateLimit('b', opts);
    rateLimit('b', opts);
    const blocked = rateLimit('b', opts);

    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    expect(blocked.retryAfterMs).toBeLessThanOrEqual(1000);
  });

  it('lets requests through again after the window expires', () => {
    let now = 1_000_000;
    const clock = () => now;
    const opts = { limit: 1, windowMs: 1000, now: clock };

    expect(rateLimit('c', opts).ok).toBe(true);
    expect(rateLimit('c', opts).ok).toBe(false);

    // Advance past the window.
    now += 1001;
    expect(rateLimit('c', opts).ok).toBe(true);
  });

  it('tracks limits independently per key', () => {
    const opts = { limit: 1, windowMs: 1000, now: () => 5_000_000 };

    expect(rateLimit('user-1', opts).ok).toBe(true);
    expect(rateLimit('user-1', opts).ok).toBe(false);
    expect(rateLimit('user-2', opts).ok).toBe(true);
  });
});

describe('getClientKey', () => {
  it('returns the first IP from x-forwarded-for', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' });
    expect(getClientKey(headers)).toBe('203.0.113.5');
  });

  it('falls back to x-real-ip', () => {
    const headers = new Headers({ 'x-real-ip': '198.51.100.7' });
    expect(getClientKey(headers)).toBe('198.51.100.7');
  });

  it("returns 'unknown' when no client headers are present", () => {
    expect(getClientKey(new Headers())).toBe('unknown');
  });
});

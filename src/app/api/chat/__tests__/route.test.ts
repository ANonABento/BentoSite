import { describe, it, expect, beforeEach, vi } from 'vitest';
import { __resetRateLimit } from '@/lib/rate-limit';

// Ensure no API key in tests so the route stays in demo mode (no real AI call).
vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', '');

// Stub Next.js ImageResponse / NextResponse import path is fine; we use them via the route.
import { POST, GET } from '../route';

function jsonRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('POST /api/chat', () => {
  beforeEach(() => {
    __resetRateLimit();
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await POST(
      jsonRequest('{not json', { 'x-forwarded-for': '10.0.0.1' }) as never
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Invalid JSON/);
  });

  it('rejects non-object bodies', async () => {
    const res = await POST(
      jsonRequest([], { 'x-forwarded-for': '10.0.0.2' }) as never
    );
    expect(res.status).toBe(400);
  });

  it('rejects missing messages field', async () => {
    const res = await POST(
      jsonRequest({}, { 'x-forwarded-for': '10.0.0.3' }) as never
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/messages array required/);
  });

  it('rejects more than the max number of messages', async () => {
    const messages = Array.from({ length: 21 }, () => ({
      role: 'user',
      content: 'hi',
    }));
    const res = await POST(
      jsonRequest({ messages }, { 'x-forwarded-for': '10.0.0.4' }) as never
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Too many messages/);
  });

  it('rejects an oversized single message', async () => {
    const messages = [{ role: 'user', content: 'x'.repeat(5000) }];
    const res = await POST(
      jsonRequest({ messages }, { 'x-forwarded-for': '10.0.0.5' }) as never
    );
    expect(res.status).toBe(400);
  });

  it('rejects unknown roles', async () => {
    const messages = [{ role: 'system', content: 'pwn' }];
    const res = await POST(
      jsonRequest({ messages }, { 'x-forwarded-for': '10.0.0.6' }) as never
    );
    expect(res.status).toBe(400);
  });

  it('returns 503 demo mode when no API key is configured and input is valid', async () => {
    const messages = [{ role: 'user', content: 'hello' }];
    const res = await POST(
      jsonRequest({ messages }, { 'x-forwarded-for': '10.0.0.7' }) as never
    );
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.isDemoMode).toBe(true);
  });

  it('rate-limits a noisy client', async () => {
    const messages = [{ role: 'user', content: 'hi' }];
    const ip = '10.0.0.99';

    // Burn through the limit (20).
    for (let i = 0; i < 20; i++) {
      const res = await POST(
        jsonRequest({ messages }, { 'x-forwarded-for': ip }) as never
      );
      // demo mode 503 is fine — it counts as a hit.
      expect([400, 503]).toContain(res.status);
    }

    const res = await POST(
      jsonRequest({ messages }, { 'x-forwarded-for': ip }) as never
    );
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeTruthy();
  });
});

describe('GET /api/chat', () => {
  it('rejects with 405 method-not-allowed', async () => {
    const res = await GET();
    expect(res.status).toBe(405);
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { __resetRateLimit } from '@/lib/rate-limit';

// Disable the file-write side effect for tests.
vi.stubEnv('FEEDBACK_FILE', '');

import { POST, GET } from '../route';

function jsonRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const validPayload = {
  messageId: 'msg-1',
  feedback: 'positive',
  messageContent: 'Hello there',
};

describe('POST /api/feedback', () => {
  beforeEach(() => {
    __resetRateLimit();
  });

  it('accepts a well-formed payload (202 when no FEEDBACK_FILE)', async () => {
    const res = await POST(
      jsonRequest(validPayload, { 'x-forwarded-for': '10.1.0.1' }) as never
    );
    expect(res.status).toBe(202);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.persisted).toBe(false);
  });

  it('rejects malformed JSON', async () => {
    const res = await POST(
      jsonRequest('{', { 'x-forwarded-for': '10.1.0.2' }) as never
    );
    expect(res.status).toBe(400);
  });

  it('rejects missing messageId', async () => {
    const res = await POST(
      jsonRequest(
        { feedback: 'positive', messageContent: 'hi' },
        { 'x-forwarded-for': '10.1.0.3' }
      ) as never
    );
    expect(res.status).toBe(400);
  });

  it('rejects unknown feedback values', async () => {
    const res = await POST(
      jsonRequest(
        { ...validPayload, feedback: 'meh' },
        { 'x-forwarded-for': '10.1.0.4' }
      ) as never
    );
    expect(res.status).toBe(400);
  });

  it('rejects oversized messageId', async () => {
    const res = await POST(
      jsonRequest(
        { ...validPayload, messageId: 'a'.repeat(200) },
        { 'x-forwarded-for': '10.1.0.5' }
      ) as never
    );
    expect(res.status).toBe(400);
  });

  it('rejects oversized messageContent', async () => {
    const res = await POST(
      jsonRequest(
        { ...validPayload, messageContent: 'b'.repeat(1000) },
        { 'x-forwarded-for': '10.1.0.6' }
      ) as never
    );
    expect(res.status).toBe(400);
  });

  it('rejects empty messageContent after trimming', async () => {
    const res = await POST(
      jsonRequest(
        { ...validPayload, messageContent: '   ' },
        { 'x-forwarded-for': '10.1.0.7' }
      ) as never
    );
    expect(res.status).toBe(400);
  });

  it('ignores client-supplied timestamp', async () => {
    const res = await POST(
      jsonRequest(
        { ...validPayload, timestamp: 'not-a-number' },
        { 'x-forwarded-for': '10.1.0.8' }
      ) as never
    );
    // Server now stamps timestamp itself, so unknown extra keys are fine.
    expect(res.status).toBe(202);
  });

  it('rate-limits a noisy client', async () => {
    const ip = '10.1.0.99';
    for (let i = 0; i < 30; i++) {
      const res = await POST(
        jsonRequest(validPayload, { 'x-forwarded-for': ip }) as never
      );
      expect([200, 202]).toContain(res.status);
    }
    const res = await POST(
      jsonRequest(validPayload, { 'x-forwarded-for': ip }) as never
    );
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeTruthy();
  });
});

describe('GET /api/feedback', () => {
  it('rejects with 405', async () => {
    const res = await GET();
    expect(res.status).toBe(405);
  });
});

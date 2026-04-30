import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const originalEnv = { ...process.env };

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validPayload = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'I would like to talk about a robotics project.',
  company: '',
};

describe('contact API route', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    delete process.env.RESEND_API_KEY;
    delete process.env.CONTACT_FROM_EMAIL;
    delete process.env.CONTACT_TO_EMAIL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it('rejects malformed contact submissions', async () => {
    const response = await POST(createRequest({
      name: 'A',
      email: 'not-an-email',
      message: 'short',
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid contact payload',
    });
  });

  it('silently accepts honeypot submissions without sending email', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    const response = await POST(createRequest({
      company: 'Spam Corp',
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      sent: false,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts valid messages when email delivery is not configured', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    const response = await POST(createRequest(validPayload));

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({
      success: true,
      sent: false,
      configured: false,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends configured messages through Resend with escaped HTML', async () => {
    process.env.RESEND_API_KEY = 'resend-key';
    process.env.CONTACT_FROM_EMAIL = 'Portfolio <hello@example.com>';
    process.env.CONTACT_TO_EMAIL = 'kevin@example.com';
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'email-id' }), { status: 200 })
    );

    const response = await POST(createRequest({
      name: '<Ada>',
      email: 'ADA@EXAMPLE.COM',
      message: 'Hello <script>alert("x")</script>',
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      sent: true,
      configured: true,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer resend-key',
          'Content-Type': 'application/json',
        },
      })
    );

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(requestInit.body as string) as Record<string, unknown>;

    expect(body).toMatchObject({
      from: 'Portfolio <hello@example.com>',
      to: ['kevin@example.com'],
      reply_to: 'ada@example.com',
      subject: 'Portfolio contact from <Ada>',
    });
    expect(body.html).toContain('&lt;Ada&gt;');
    expect(body.html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  });
});

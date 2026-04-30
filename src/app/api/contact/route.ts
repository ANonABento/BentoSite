import { NextRequest, NextResponse } from 'next/server';
import { siteConfig } from '@/lib/site-config';

const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 4000;
const MIN_MESSAGE_LENGTH = 10;
const RESEND_API_URL = 'https://api.resend.com/emails';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ContactPayload {
  name: string;
  email: string;
  message: string;
  company?: string;
}

interface ResendErrorResponse {
  message?: string;
  name?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeString(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function parseContactPayload(body: unknown): ContactPayload | null {
  if (!isRecord(body)) {
    return null;
  }

  const name = normalizeString(body.name, MAX_NAME_LENGTH);
  const email = normalizeString(body.email, MAX_EMAIL_LENGTH).toLowerCase();
  const message = normalizeString(body.message, MAX_MESSAGE_LENGTH);
  const company = normalizeString(body.company, MAX_NAME_LENGTH);

  if (
    name.length < 2 ||
    !EMAIL_PATTERN.test(email) ||
    message.length < MIN_MESSAGE_LENGTH
  ) {
    return null;
  }

  return { name, email, message, company };
}

function hasHoneypotValue(body: unknown): boolean {
  return isRecord(body) && normalizeString(body.company, MAX_NAME_LENGTH).length > 0;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildContactEmailHtml(payload: ContactPayload): string {
  const escapedName = escapeHtml(payload.name);
  const escapedEmail = escapeHtml(payload.email);
  const escapedMessage = escapeHtml(payload.message).replaceAll('\n', '<br />');

  return `
    <h1>New portfolio contact</h1>
    <p><strong>Name:</strong> ${escapedName}</p>
    <p><strong>Email:</strong> ${escapedEmail}</p>
    <p><strong>Message:</strong></p>
    <p>${escapedMessage}</p>
  `;
}

function getContactConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL || siteConfig.links.email;
  const from = process.env.CONTACT_FROM_EMAIL;

  return {
    apiKey,
    to,
    from,
    isConfigured: Boolean(apiKey && to && from),
  };
}

async function sendContactEmail(payload: ContactPayload) {
  const config = getContactConfig();

  if (!config.isConfigured) {
    if (process.env.NODE_ENV === 'development') {
      console.info('Contact API accepted message without email provider configuration.');
    }

    return { sent: false, configured: false };
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.from,
      to: [config.to],
      reply_to: payload.email,
      subject: `Portfolio contact from ${payload.name}`,
      html: buildContactEmailHtml(payload),
      text: `Name: ${payload.name}\nEmail: ${payload.email}\n\n${payload.message}`,
    }),
  });

  if (!response.ok) {
    let errorBody: ResendErrorResponse = {};

    try {
      errorBody = await response.json();
    } catch {
      errorBody = {};
    }

    throw new Error(errorBody.message || errorBody.name || 'Failed to send contact email');
  }

  return { sent: true, configured: true };
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (hasHoneypotValue(body)) {
      return NextResponse.json({ success: true, sent: false }, { status: 200 });
    }

    const payload = parseContactPayload(body);

    if (!payload) {
      return NextResponse.json({ error: 'Invalid contact payload' }, { status: 400 });
    }

    const result = await sendContactEmail(payload);

    return NextResponse.json(
      { success: true, ...result },
      { status: result.sent ? 200 : 202 }
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Contact API error:', error);
    }

    return NextResponse.json(
      { error: 'Unable to send message right now' },
      { status: 502 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}

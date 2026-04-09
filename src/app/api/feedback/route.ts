import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

interface FeedbackEntry {
  messageId: string;
  feedback: 'positive' | 'negative';
  messageContent: string;
  timestamp: number;
  userAgent?: string;
}

interface FeedbackStore {
  entries: FeedbackEntry[];
}

const FEEDBACK_FILE = process.env.FEEDBACK_FILE || path.join(os.tmpdir(), 'portfolio-feedback.json');
const MAX_MESSAGE_ID_LENGTH = 128;
const MAX_MESSAGE_CONTENT_LENGTH = 500;
const MAX_USER_AGENT_LENGTH = 256;

interface FeedbackPayload {
  messageId: string;
  feedback: FeedbackEntry['feedback'];
  messageContent: string;
  timestamp: number;
}

function parseFeedbackPayload(body: unknown): FeedbackPayload | null {
  if (typeof body !== 'object' || body === null) {
    return null;
  }

  const { messageId, feedback, messageContent, timestamp } = body as Record<string, unknown>;
  const normalizedMessageId = typeof messageId === 'string' ? messageId.trim() : '';
  const normalizedMessageContent =
    typeof messageContent === 'string' ? messageContent.trim() : '';

  if (
    normalizedMessageId.length === 0 ||
    normalizedMessageId.length > MAX_MESSAGE_ID_LENGTH ||
    normalizedMessageContent.length === 0 ||
    !Number.isFinite(timestamp) ||
    typeof timestamp !== 'number' ||
    (feedback !== 'positive' && feedback !== 'negative')
  ) {
    return null;
  }

  return {
    messageId: normalizedMessageId,
    feedback,
    messageContent: normalizedMessageContent.slice(0, MAX_MESSAGE_CONTENT_LENGTH),
    timestamp,
  };
}

async function loadFeedback(): Promise<FeedbackStore> {
  try {
    const data = await fs.readFile(FEEDBACK_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    // File doesn't exist or is invalid, return empty store
    return { entries: [] };
  }
}

async function saveFeedback(store: FeedbackStore): Promise<void> {
  await fs.mkdir(path.dirname(FEEDBACK_FILE), { recursive: true });
  await fs.writeFile(FEEDBACK_FILE, JSON.stringify(store, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const payload = parseFeedbackPayload(body);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid feedback payload' },
        { status: 400 }
      );
    }

    // Create feedback entry
    const entry: FeedbackEntry = {
      ...payload,
      userAgent:
        request.headers.get('user-agent')?.slice(0, MAX_USER_AGENT_LENGTH) || undefined,
    };

    // Load existing feedback and append
    const store = await loadFeedback();
    store.entries.push(entry);

    // Keep only last 1000 entries to prevent unbounded growth
    if (store.entries.length > 1000) {
      store.entries = store.entries.slice(-1000);
    }

    await saveFeedback(store);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Optional: Allow reading feedback for analytics
  try {
    const store = await loadFeedback();
    const summary = {
      total: store.entries.length,
      positive: store.entries.filter(e => e.feedback === 'positive').length,
      negative: store.entries.filter(e => e.feedback === 'negative').length,
    };
    return NextResponse.json(summary);
  } catch {
    return NextResponse.json({ total: 0, positive: 0, negative: 0 });
  }
}

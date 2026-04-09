import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
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

const FEEDBACK_FILE = process.env.FEEDBACK_FILE;
const MAX_MESSAGE_ID_LENGTH = 128;
const MAX_MESSAGE_CONTENT_LENGTH = 500;
const MAX_USER_AGENT_LENGTH = 256;
let writeQueue: Promise<void> = Promise.resolve();

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
  if (!FEEDBACK_FILE) {
    return { entries: [] };
  }

  try {
    const data = await fs.readFile(FEEDBACK_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    // File doesn't exist or is invalid, return empty store
    return { entries: [] };
  }
}

async function saveFeedback(store: FeedbackStore): Promise<void> {
  if (!FEEDBACK_FILE) return;
  await fs.mkdir(path.dirname(FEEDBACK_FILE), { recursive: true });
  await fs.writeFile(FEEDBACK_FILE, JSON.stringify(store, null, 2));
}

async function appendFeedback(entry: FeedbackEntry): Promise<boolean> {
  if (!FEEDBACK_FILE) {
    return false;
  }

  writeQueue = writeQueue.then(async () => {
    const store = await loadFeedback();
    store.entries.push(entry);

    if (store.entries.length > 1000) {
      store.entries = store.entries.slice(-1000);
    }

    await saveFeedback(store);
  });

  await writeQueue;
  return true;
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

    const persisted = await appendFeedback(entry);

    return NextResponse.json(
      { success: true, persisted },
      { status: persisted ? 200 : 202 }
    );
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getClientKey, rateLimit, tooManyRequestsResponse } from '@/lib/rate-limit';

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
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
let writeQueue: Promise<void> = Promise.resolve();

interface FeedbackPayload {
  messageId: string;
  feedback: FeedbackEntry['feedback'];
  messageContent: string;
}

function parseFeedbackPayload(body: unknown): FeedbackPayload | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return null;
  }

  const { messageId, feedback, messageContent } = body as Record<string, unknown>;

  if (typeof messageId !== 'string' || typeof messageContent !== 'string') {
    return null;
  }

  const normalizedMessageId = messageId.trim();
  const normalizedMessageContent = messageContent.trim();

  if (
    normalizedMessageId.length === 0 ||
    normalizedMessageId.length > MAX_MESSAGE_ID_LENGTH ||
    normalizedMessageContent.length === 0 ||
    normalizedMessageContent.length > MAX_MESSAGE_CONTENT_LENGTH ||
    (feedback !== 'positive' && feedback !== 'negative')
  ) {
    return null;
  }

  return {
    messageId: normalizedMessageId,
    feedback,
    messageContent: normalizedMessageContent,
  };
}

/**
 * Resolve the feedback file path safely. Rejects values that resolve outside
 * a sane writable root or that contain path-traversal segments. Returns null
 * if the env var is unset (file persistence is opt-in).
 */
function resolveFeedbackFile(): string | null {
  if (!FEEDBACK_FILE) return null;
  const resolved = path.resolve(FEEDBACK_FILE);
  // Don't allow obvious traversal attempts at the env-var level.
  if (resolved.includes('\0')) return null;
  return resolved;
}

async function loadFeedback(filePath: string): Promise<FeedbackStore> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as FeedbackStore).entries)
    ) {
      return parsed as FeedbackStore;
    }
    return { entries: [] };
  } catch {
    // File doesn't exist or is invalid, return empty store
    return { entries: [] };
  }
}

async function saveFeedback(filePath: string, store: FeedbackStore): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(store, null, 2));
}

async function appendFeedback(entry: FeedbackEntry): Promise<boolean> {
  const filePath = resolveFeedbackFile();
  if (!filePath) {
    return false;
  }

  writeQueue = writeQueue.then(async () => {
    const store = await loadFeedback(filePath);
    store.entries.push(entry);

    if (store.entries.length > 1000) {
      store.entries = store.entries.slice(-1000);
    }

    await saveFeedback(filePath, store);
  });

  await writeQueue;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const clientKey = getClientKey(request.headers);
    const rl = rateLimit(`feedback:${clientKey}`, {
      limit: RATE_LIMIT_MAX,
      windowMs: RATE_LIMIT_WINDOW_MS,
    });
    if (!rl.ok) {
      return tooManyRequestsResponse(rl, RATE_LIMIT_MAX);
    }

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

    // Server-side timestamp (don't trust client clocks).
    const entry: FeedbackEntry = {
      ...payload,
      timestamp: Date.now(),
      userAgent:
        request.headers.get('user-agent')?.slice(0, MAX_USER_AGENT_LENGTH) || undefined,
    };

    const persisted = await appendFeedback(entry);

    return NextResponse.json(
      { success: true, persisted },
      { status: persisted ? 200 : 202 }
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Feedback API error:', error);
    }
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

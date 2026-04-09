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
let writeQueue: Promise<void> = Promise.resolve();

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
    const body = await request.json();
    const { messageId, feedback, messageContent, timestamp } = body;

    // Validate required fields
    if (!messageId || !feedback || !messageContent || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate feedback value
    if (feedback !== 'positive' && feedback !== 'negative') {
      return NextResponse.json(
        { error: 'Invalid feedback value' },
        { status: 400 }
      );
    }

    // Create feedback entry
    const entry: FeedbackEntry = {
      messageId,
      feedback,
      messageContent: messageContent.substring(0, 500), // Limit content length
      timestamp,
      userAgent: request.headers.get('user-agent') || undefined,
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

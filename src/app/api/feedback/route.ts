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

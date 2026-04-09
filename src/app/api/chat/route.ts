import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT, PORTFOLIO_DATA } from '@/lib/portfolio-context';

// Constants
const MAX_MESSAGE_LENGTH = 4000;
const MAX_MESSAGES_COUNT = 20;
const MAX_TOTAL_CONTENT_LENGTH = 50000;

// Initialize Gemini AI only if API key is available
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Validate message structure
function isValidMessage(msg: unknown): msg is ChatMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'role' in msg &&
    'content' in msg &&
    (msg.role === 'user' || msg.role === 'assistant') &&
    typeof msg.content === 'string' &&
    msg.content.length <= MAX_MESSAGE_LENGTH
  );
}

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!genAI) {
      return NextResponse.json(
        {
          error: 'API key not configured',
          message: "I'm currently in demo mode. Please configure the Gemini API key to enable full AI responses.",
          isDemoMode: true,
        },
        { status: 503 }
      );
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

    const { messages } = body as { messages: unknown[] };

    // Validate messages array exists
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      );
    }

    // Validate message count
    if (messages.length > MAX_MESSAGES_COUNT) {
      return NextResponse.json(
        { error: `Too many messages. Maximum ${MAX_MESSAGES_COUNT} allowed.` },
        { status: 400 }
      );
    }

    // Validate each message structure
    const validMessages: ChatMessage[] = [];
    for (const msg of messages) {
      if (!isValidMessage(msg)) {
        return NextResponse.json(
          { error: 'Invalid message format or content too long' },
          { status: 400 }
        );
      }
      validMessages.push(msg);
    }

    // Validate total content length
    const totalLength = validMessages.reduce((sum, msg) => sum + msg.content.length, 0);
    if (totalLength > MAX_TOTAL_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: 'Total message content too large' },
        { status: 400 }
      );
    }

    // Use Gemini 1.5 Flash for fast, free responses
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Limit conversation history to last 10 messages to avoid bloat
    const recentMessages = validMessages.slice(-10);
    const conversationHistory = recentMessages
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    // Create the full prompt with system context
    const fullPrompt = `${SYSTEM_PROMPT}

## Conversation History
${conversationHistory}

Please respond to the user's latest message in a helpful and friendly manner. Keep your response concise (2-4 sentences for simple questions, more for complex ones).`;

    // Generate response
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({
      message: text,
      isDemoMode: false,
    });
  } catch (error) {
    // Log error for debugging (in production, use proper logging)
    if (process.env.NODE_ENV === 'development') {
      console.error('Chat API error:', error);
    }

    // Return proper 500 status for server errors
    return NextResponse.json(
      {
        error: 'Failed to generate response',
        message: `I apologize, but I'm having trouble connecting right now. In the meantime, you can reach ${PORTFOLIO_DATA.personal.name} directly at ${PORTFOLIO_DATA.personal.email}.`,
        isDemoMode: true,
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}

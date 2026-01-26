import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT, PORTFOLIO_DATA } from '@/lib/portfolio-context';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        {
          error: 'API key not configured',
          message: "I'm currently in demo mode. Please configure the Gemini API key to enable full AI responses.",
          isDemoMode: true,
        },
        { status: 200 }
      );
    }

    const body = await request.json();
    const { messages } = body as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      );
    }

    // Use Gemini 1.5 Flash for fast, free responses
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Build conversation history for context
    const conversationHistory = messages
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
    console.error('Chat API error:', error);

    // Return a friendly error message
    return NextResponse.json(
      {
        error: 'Failed to generate response',
        message: `I apologize, but I'm having trouble connecting right now. In the meantime, you can reach ${PORTFOLIO_DATA.personal.name} directly at ${PORTFOLIO_DATA.personal.email}.`,
        isDemoMode: true,
      },
      { status: 200 }
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

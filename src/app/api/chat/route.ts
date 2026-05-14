import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import {
  buildAssistantInstructions,
  checkChatGuardrails,
  createDemoResponse,
  formatRetrievedContext,
  getDefaultPortfolioContext,
  getLatestUserMessage,
  PORTFOLIO_DATA,
  retrievePortfolioContext,
  type ChatMessage,
} from '@/lib/chat-knowledge';

// Constants
const MAX_MESSAGE_LENGTH = 4000;
const MAX_MESSAGES_COUNT = 20;
const MAX_TOTAL_CONTENT_LENGTH = 50000;
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const GEMINI_GENERATE_URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_OPENAI_MODEL = 'gpt-5.4-mini';
// Quality-first fallback chain. When the primary model returns a retryable
// error (429 rate limit, 5xx server error, 404 model-not-found), we walk
// down the chain. Each model has its own daily quota, so chaining four
// free-tier models stacks the effective per-day ceiling to ~4250 requests.
const DEFAULT_GEMINI_MODEL_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
  'gemini-1.5-flash',
] as const;

// Rate limit: 10 chat sends per 60s per IP, sliding window.
// When UPSTASH_REDIS_REST_URL / _TOKEN are unset (e.g. local dev), the
// limiter is null and the route serves traffic unthrottled — degrade safely.
const CHAT_RATELIMIT_REQUESTS = 10;
const CHAT_RATELIMIT_WINDOW = '60 s' as const;

const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(CHAT_RATELIMIT_REQUESTS, CHAT_RATELIMIT_WINDOW),
        analytics: true,
        prefix: 'bentosite-chat',
      })
    : null;

type ChatProvider = 'demo' | 'google' | 'openai';

const openaiApiKey = process.env.OPENAI_API_KEY;
const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
const openaiModel = process.env.OPENAI_CHAT_MODEL || DEFAULT_OPENAI_MODEL;

function getGeminiModelChain(): string[] {
  // Single-model override (legacy / explicit pin) takes precedence.
  if (process.env.GEMINI_CHAT_MODEL) {
    return [process.env.GEMINI_CHAT_MODEL];
  }
  // Custom chain via comma-separated env var.
  if (process.env.GEMINI_CHAT_MODEL_CHAIN) {
    const parsed = process.env.GEMINI_CHAT_MODEL_CHAIN
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    if (parsed.length > 0) return parsed;
  }
  return [...DEFAULT_GEMINI_MODEL_CHAIN];
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip') ?? 'anonymous';
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

function formatConversation(messages: ChatMessage[]): string {
  return messages
    .map((message) => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`)
    .join('\n\n');
}

function resolveChatProvider(): ChatProvider {
  const configured = process.env.CHAT_PROVIDER?.toLowerCase();
  if (configured === 'google' || configured === 'gemini') {
    return googleApiKey ? 'google' : 'demo';
  }

  if (configured === 'openai') {
    return openaiApiKey ? 'openai' : 'demo';
  }

  if (googleApiKey) return 'google';
  if (openaiApiKey) return 'openai';
  return 'demo';
}

function parseOpenAIText(payload: unknown): string | null {
  if (
    payload &&
    typeof payload === 'object' &&
    'output_text' in payload &&
    typeof payload.output_text === 'string'
  ) {
    return payload.output_text;
  }

  if (!payload || typeof payload !== 'object' || !('output' in payload) || !Array.isArray(payload.output)) {
    return null;
  }

  const textParts: string[] = [];
  for (const item of payload.output) {
    if (!item || typeof item !== 'object' || !('content' in item) || !Array.isArray(item.content)) {
      continue;
    }

    for (const content of item.content) {
      if (
        content &&
        typeof content === 'object' &&
        'text' in content &&
        typeof content.text === 'string'
      ) {
        textParts.push(content.text);
      }
    }
  }

  return textParts.length > 0 ? textParts.join('\n').trim() : null;
}

async function generateOpenAIResponse(messages: ChatMessage[], instructions: string): Promise<string> {
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: openaiModel,
      instructions,
      input: formatConversation(messages),
      max_output_tokens: 700,
      metadata: {
        app: 'bentosite',
        surface: 'portfolio-chat',
      },
    }),
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      payload.error &&
      typeof payload.error === 'object' &&
      'message' in payload.error &&
      typeof payload.error.message === 'string'
        ? payload.error.message
        : `OpenAI request failed with status ${response.status}`;
    throw new Error(message);
  }

  const text = parseOpenAIText(payload);
  if (!text) {
    throw new Error('OpenAI response did not include text output');
  }

  return text;
}

function toGeminiContents(messages: ChatMessage[]) {
  return messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }));
}

function parseGeminiText(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || !('candidates' in payload) || !Array.isArray(payload.candidates)) {
    return null;
  }

  const textParts: string[] = [];
  for (const candidate of payload.candidates) {
    if (
      !candidate ||
      typeof candidate !== 'object' ||
      !('content' in candidate) ||
      !candidate.content ||
      typeof candidate.content !== 'object' ||
      !('parts' in candidate.content) ||
      !Array.isArray(candidate.content.parts)
    ) {
      continue;
    }

    for (const part of candidate.content.parts) {
      if (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string') {
        textParts.push(part.text);
      }
    }
  }

  return textParts.length > 0 ? textParts.join('\n').trim() : null;
}

class GeminiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'GeminiError';
  }
}

async function generateGeminiResponse(
  model: string,
  messages: ChatMessage[],
  instructions: string,
): Promise<string> {
  const response = await fetch(`${GEMINI_GENERATE_URL_BASE}/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': googleApiKey ?? '',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: instructions }],
      },
      contents: toGeminiContents(messages),
      generationConfig: {
        maxOutputTokens: 700,
        temperature: 0.2,
      },
    }),
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      payload.error &&
      typeof payload.error === 'object' &&
      'message' in payload.error &&
      typeof payload.error.message === 'string'
        ? payload.error.message
        : `Gemini request failed with status ${response.status}`;
    throw new GeminiError(response.status, message);
  }

  const text = parseGeminiText(payload);
  if (!text) {
    // No HTTP status code applies here (200 OK with malformed body) — use 0 so
    // the fallback wrapper treats it as retryable on a different model.
    throw new GeminiError(0, 'Gemini response did not include text output');
  }

  return text;
}

// Terminal = same key/payload will fail on every model, so don't waste time.
// 400 = malformed payload, 401 = invalid API key.
// Everything else (404 model-not-found, 429 rate limit, 5xx, network) is
// retried against the next model in the chain.
function isTerminalGeminiError(err: unknown): boolean {
  return err instanceof GeminiError && (err.status === 400 || err.status === 401);
}

async function generateGeminiResponseWithFallback(
  messages: ChatMessage[],
  instructions: string,
): Promise<string> {
  const chain = getGeminiModelChain();
  const failures: string[] = [];

  for (let index = 0; index < chain.length; index += 1) {
    const model = chain[index];
    try {
      const text = await generateGeminiResponse(model, messages, instructions);
      if (index > 0) {
        console.info(`[chat] Gemini fallback succeeded on "${model}" after ${index} failure(s)`);
      }
      return text;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failures.push(`${model}: ${message}`);

      if (isTerminalGeminiError(err)) {
        // Auth / validation — every other model would fail identically.
        throw err;
      }

      const next = chain[index + 1];
      console.warn(
        `[chat] Gemini "${model}" failed (${message});`,
        next ? `falling back to "${next}"` : 'no more models in chain',
      );
    }
  }

  throw new Error(`All Gemini models exhausted:\n${failures.join('\n')}`);
}

async function generateProviderResponse(
  provider: Exclude<ChatProvider, 'demo'>,
  messages: ChatMessage[],
  instructions: string
): Promise<string> {
  if (provider === 'google') {
    return generateGeminiResponseWithFallback(messages, instructions);
  }

  return generateOpenAIResponse(messages, instructions);
}

export async function POST(request: NextRequest) {
  try {
    if (ratelimit) {
      const ip = getClientIp(request);
      const result = await ratelimit.limit(ip);
      if (!result.success) {
        const retryAfterSec = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: `Too many chat requests. Try again in ${retryAfterSec}s, or email ${PORTFOLIO_DATA.personal.email} directly.`,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfterSec),
              'X-RateLimit-Limit': String(result.limit),
              'X-RateLimit-Remaining': String(result.remaining),
              'X-RateLimit-Reset': String(result.reset),
            },
          }
        );
      }
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

    const latestUserMessage = getLatestUserMessage(validMessages);
    const provider = resolveChatProvider();
    const guardrail = checkChatGuardrails(latestUserMessage);
    if (!guardrail.allowed) {
      return NextResponse.json({
        message: guardrail.response,
        isDemoMode: provider === 'demo',
        provider,
      });
    }

    const retrievedSections = retrievePortfolioContext(latestUserMessage);
    const groundedSections = retrievedSections.length > 0
      ? retrievedSections
      : getDefaultPortfolioContext();
    const retrievedContext = formatRetrievedContext(groundedSections);
    const instructions = buildAssistantInstructions(retrievedContext);
    const recentMessages = validMessages.slice(-10);

    if (provider === 'demo') {
      return NextResponse.json({
        message: createDemoResponse(latestUserMessage, retrievedContext),
        isDemoMode: true,
        provider,
      });
    }

    return NextResponse.json({
      message: await generateProviderResponse(provider, recentMessages, instructions),
      isDemoMode: false,
      provider,
    });
  } catch (error) {
    // Always log so Vercel function logs capture the upstream provider error.
    // Safe because Vercel logs are private to the project owner.
    console.error('Chat API error:', error);

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

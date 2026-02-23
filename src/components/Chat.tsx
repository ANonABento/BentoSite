'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { m } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { SUGGESTED_QUESTIONS, PORTFOLIO_DATA } from '@/lib/portfolio-context';
import { buttonTap } from '@/lib/animations';
import { useToast } from '@/components/ui/Toast';
import { useClipboard } from '@/lib/clipboard';
import { analytics } from '@/lib/analytics';

// === TYPES & CONSTANTS ===

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  feedback?: 'positive' | 'negative' | null;
}

interface ChatFunctions {
  send: (content: string) => void;
  addAssistant: (content: string) => void;
  clear: () => void;
}

interface ChatbotProps {
  onReady?: (fns: ChatFunctions) => void;
  onViewResume?: () => void;
  onSeeProjects?: () => void;
}

const STORAGE_KEY = 'portfolio-chat-history';
const MAX_STORED_MESSAGES = 50;

// === STORAGE UTILITIES ===

function getDefaultMessage(): Message {
  return {
    id: '1',
    role: 'assistant',
    content: `Hello! I'm ${PORTFOLIO_DATA.personal.name}'s AI assistant. I can tell you about their skills, projects, and experience. What would you like to know?`,
    timestamp: Date.now(),
  };
}

function loadMessages(): Message[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return null;
    // Validate structure
    const valid = parsed.filter(
      (m: unknown): m is Message =>
        m !== null &&
        typeof m === 'object' &&
        'id' in m &&
        'role' in m &&
        'content' in m &&
        'timestamp' in m
    );
    return valid.length > 0 ? valid : null;
  } catch {
    return null;
  }
}

function saveMessages(messages: Message[]): void {
  if (typeof window === 'undefined') return;
  try {
    const toStore = messages.slice(-MAX_STORED_MESSAGES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // Storage full or unavailable - fail silently
  }
}

function clearStoredMessages(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Fail silently
  }
}

// === SUB-COMPONENTS ===

function CopyButton({ text, onCopied }: { text: string; onCopied?: () => void }) {
  const { copied, copy } = useClipboard();

  const handleCopy = async () => {
    const success = await copy(text);
    if (success) {
      onCopied?.();
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-sm bg-[var(--glass-bg)] hover:bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200"
      aria-label={copied ? 'Copied!' : 'Copy message'}
      title={copied ? 'Copied!' : 'Copy message'}
    >
      {copied ? (
        <svg className="w-3.5 h-3.5 text-[var(--status-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

function FeedbackButtons({
  messageId,
  currentFeedback,
  onFeedback,
}: {
  messageId: string;
  currentFeedback?: 'positive' | 'negative' | null;
  onFeedback: (messageId: string, feedback: 'positive' | 'negative') => void;
}) {
  return (
    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[var(--border)]">
      <span className="text-[10px] text-[var(--text-muted)] mr-1">Was this helpful?</span>
      <button
        onClick={() => onFeedback(messageId, 'positive')}
        className={`p-1 rounded transition-colors ${
          currentFeedback === 'positive'
            ? 'text-[var(--status-success)] bg-[var(--status-success-muted)]'
            : 'text-[var(--text-muted)] hover:text-[var(--status-success)] hover:bg-[var(--status-success-muted)]'
        }`}
        aria-label="Helpful response"
        aria-pressed={currentFeedback === 'positive'}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
      </button>
      <button
        onClick={() => onFeedback(messageId, 'negative')}
        className={`p-1 rounded transition-colors ${
          currentFeedback === 'negative'
            ? 'text-[var(--status-error)] bg-[var(--status-error-muted)]'
            : 'text-[var(--text-muted)] hover:text-[var(--status-error)] hover:bg-[var(--status-error-muted)]'
        }`}
        aria-label="Not helpful response"
        aria-pressed={currentFeedback === 'negative'}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
        </svg>
      </button>
    </div>
  );
}

function QuickActions({
  onViewResume,
  onSeeProjects,
  disabled,
}: {
  onViewResume?: () => void;
  onSeeProjects?: () => void;
  disabled: boolean;
}) {
  if (!onViewResume && !onSeeProjects) return null;

  return (
    <div className="flex flex-wrap gap-3 px-4 pb-2">
      {onViewResume && (
        <button
          type="button"
          onClick={onViewResume}
          disabled={disabled}
          className="text-xs font-mono text-[var(--orange)] hover:underline transition-all duration-150 disabled:opacity-50"
        >
          [resume --download]
        </button>
      )}
      {onSeeProjects && (
        <button
          type="button"
          onClick={onSeeProjects}
          disabled={disabled}
          className="text-xs font-mono text-[var(--purple)] hover:underline transition-all duration-150 disabled:opacity-50"
        >
          [projects --list]
        </button>
      )}
    </div>
  );
}

// === MAIN COMPONENT ===

export default function Chatbot({ onReady, onViewResume, onSeeProjects }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([getDefaultMessage()]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { success: toastSuccess } = useToast();

  // Load messages from localStorage on mount (client-side only)
  useEffect(() => {
    const stored = loadMessages();
    if (stored) {
      setMessages(stored);
    }
    setIsHydrated(true);
  }, []);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (isHydrated) {
      saveMessages(messages);
    }
  }, [messages, isHydrated]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleFeedback = useCallback(async (messageId: string, feedback: 'positive' | 'negative') => {
    // Find the message to get its content
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    // Toggle feedback - if clicking same button, clear it
    const newFeedback = message.feedback === feedback ? null : feedback;

    // Update local state
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, feedback: newFeedback }
          : msg
      )
    );

    // Only send to API if setting feedback (not clearing)
    if (newFeedback) {
      try {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId,
            feedback: newFeedback,
            messageContent: message.content,
            timestamp: Date.now(),
          }),
        });
      } catch {
        // Fail silently - feedback is not critical
      }
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      analytics.chatMessageSent();

      const messageId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const userMessage: Message = {
        id: messageId,
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };

      // Use functional update to avoid stale closure on messages
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);
      setError(null);

      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        // Use functional form to get current messages
        const currentMessages = await new Promise<Message[]>((resolve) => {
          setMessages((prev) => {
            resolve(prev);
            return prev;
          });
        });

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: currentMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Check response status before parsing JSON
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();

        const assistantMessage: Message = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          role: 'assistant',
          content: data.message || 'Sorry, I could not process your request.',
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const errorMsg = err instanceof Error && err.name === 'AbortError'
          ? 'Request timed out. Please try again.'
          : 'Failed to send message. Please try again.';
        setError(errorMsg);
        const errorMessage: Message = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          role: 'assistant',
          content: `I apologize, but I'm having trouble connecting right now. You can reach ${PORTFOLIO_DATA.personal.name} directly at ${PORTFOLIO_DATA.personal.email}.`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [isLoading]
  );

  const addAssistantMessage = useCallback((content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        role: 'assistant',
        content: trimmed,
        timestamp: Date.now(),
      },
    ]);
    setError(null);
  }, []);

  // Expose sendMessage and clearChat to parent component
  useEffect(() => {
    if (onReady) {
      onReady({ send: sendMessage, addAssistant: addAssistantMessage, clear: clearChat });
    }
  }, [onReady, sendMessage, addAssistantMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  const clearChat = () => {
    clearStoredMessages();
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Chat cleared! I'm ${PORTFOLIO_DATA.personal.name}'s AI assistant. What would you like to know?`,
        timestamp: Date.now(),
      },
    ]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-full" role="region" aria-label="Chat conversation">
      {/* Messages Area — Terminal Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite" aria-atomic="false">
        {messages.map((message) => {
          const timeStr = new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });

          return message.role === 'user' ? (
            /* User message — command input */
            <div key={message.id} className="group flex items-start gap-2">
              <span className="text-[var(--orange)] font-mono text-xs shrink-0 pt-0.5 select-none">
                <span className="text-[var(--text-muted)]">[{timeStr}]</span> anon@bentOS ~$
              </span>
              <p className="text-sm font-mono text-[var(--text-primary)] whitespace-pre-wrap">{message.content}</p>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                <CopyButton text={message.content} onCopied={() => toastSuccess('Copied to clipboard!')} />
              </div>
            </div>
          ) : (
            /* Assistant message — system response */
            <div key={message.id} className="group pl-4 border-l-2 border-[var(--purple-muted)]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-[var(--text-muted)] select-none">[{timeStr}] sys:</span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <CopyButton text={message.content} onCopied={() => toastSuccess('Copied to clipboard!')} />
                </div>
              </div>
              <div className="markdown-content font-mono text-sm">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
              <FeedbackButtons
                messageId={message.id}
                currentFeedback={message.feedback}
                onFeedback={handleFeedback}
              />
            </div>
          );
        })}

        {/* Typing Indicator — blinking cursor */}
        {isLoading && (
          <div className="pl-4 border-l-2 border-[var(--purple-muted)]">
            <span className="font-mono text-sm text-[var(--text-muted)]">
              processing<span className="animate-pulse">_</span>
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="pl-4 border-l-2 border-[var(--status-error)]">
            <span className="text-xs font-mono text-[var(--status-error)]">ERR: {error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions — Terminal Commands */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <span className="text-[10px] font-mono text-[var(--text-muted)] mb-1.5 block">&gt; suggested queries:</span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedQuestion(question)}
                disabled={isLoading}
                className="text-xs font-mono px-2 py-1 text-[var(--purple)] hover:text-[var(--text-primary)] hover:underline transition-all duration-150 disabled:opacity-50 before:content-['$_'] before:text-[var(--text-muted)]"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <QuickActions
        onViewResume={onViewResume}
        onSeeProjects={onSeeProjects}
        disabled={isLoading}
      />

      {/* Input Area — Terminal Prompt */}
      <div className="flex-shrink-0 px-4 py-3" style={{ borderTop: '1px solid transparent', borderImage: 'linear-gradient(90deg, transparent, var(--border), transparent) 1' }}>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <span className="text-[var(--orange)] font-mono text-sm shrink-0 select-none">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="type a command..."
            disabled={isLoading}
            aria-label="Type your message"
            className="flex-1 bg-transparent border-none font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none caret-[var(--orange)] disabled:opacity-50"
          />
          <m.button
            type="submit"
            disabled={isLoading || !input.trim()}
            whileTap={!(isLoading || !input.trim()) ? buttonTap : undefined}
            className="px-3 py-1.5 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--orange)] transition-colors duration-150 disabled:opacity-30"
            aria-label="Send message"
          >
            [enter]
          </m.button>
        </form>
      </div>
    </div>
  );
}

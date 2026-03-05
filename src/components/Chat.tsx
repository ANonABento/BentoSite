'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { m } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { SUGGESTED_QUESTIONS, PORTFOLIO_DATA } from '@/lib/portfolio-context';
import { buttonTap } from '@/lib/animations';
import { useToast } from '@/components/ui/Toast';
import { useClipboard } from '@/lib/clipboard';
import { analytics } from '@/lib/analytics';
import { generateId, getStorageItem, setStorageItem, removeStorageItem } from '@/lib/utils';
import { TIMEOUTS, STORAGE_KEYS, DEFAULTS, API_ENDPOINTS } from '@/lib/constants';
import { CheckIcon, CopyIcon, ThumbsUpIcon, ThumbsDownIcon } from '@/components/ui/Icons';

// === TYPES ===

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

// === MESSAGE HELPERS ===

function getDefaultMessage(): Message {
  return {
    id: '1',
    role: 'assistant',
    content: `Hello! I'm ${PORTFOLIO_DATA.personal.name}'s AI assistant. I can tell you about their skills, projects, and experience. What would you like to know?`,
    timestamp: Date.now(),
  };
}

function isValidMessage(m: unknown): m is Message {
  return (
    m !== null &&
    typeof m === 'object' &&
    'id' in m &&
    'role' in m &&
    'content' in m &&
    'timestamp' in m
  );
}

function loadMessages(): Message[] | null {
  const stored = getStorageItem<unknown[]>(STORAGE_KEYS.CHAT_HISTORY, []);
  if (!Array.isArray(stored) || stored.length === 0) return null;
  const valid = stored.filter(isValidMessage);
  return valid.length > 0 ? valid : null;
}

function saveMessages(messages: Message[]): void {
  const toStore = messages.slice(-DEFAULTS.MAX_CHAT_MESSAGES);
  setStorageItem(STORAGE_KEYS.CHAT_HISTORY, toStore);
}

function clearStoredMessages(): void {
  removeStorageItem(STORAGE_KEYS.CHAT_HISTORY);
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
        <CheckIcon size={14} className="text-[var(--status-success)]" />
      ) : (
        <CopyIcon size={14} />
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
        <ThumbsUpIcon size={14} />
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
        <ThumbsDownIcon size={14} />
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
        await fetch(API_ENDPOINTS.FEEDBACK, {
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

      const userMessage: Message = {
        id: generateId(),
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
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.CHAT_REQUEST);

        // Use functional form to get current messages
        const currentMessages = await new Promise<Message[]>((resolve) => {
          setMessages((prev) => {
            resolve(prev);
            return prev;
          });
        });

        const response = await fetch(API_ENDPOINTS.CHAT, {
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
          id: generateId(),
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
          id: generateId(),
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
        id: generateId(),
        role: 'assistant',
        content: trimmed,
        timestamp: Date.now(),
      },
    ]);
    setError(null);
  }, []);

  // Refs for stable onReady wrappers — see effect below clearChat
  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

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

  // Keep refs to latest functions so the onReady effect fires only once
  const clearChatRef = useRef(clearChat);
  clearChatRef.current = clearChat;

  // Expose stable wrappers to parent — fire once on mount
  useEffect(() => {
    if (onReady) {
      onReady({
        send: (content: string) => sendMessageRef.current(content),
        addAssistant: addAssistantMessage,
        clear: () => clearChatRef.current(),
      });
    }
  }, [onReady, addAssistantMessage]);

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

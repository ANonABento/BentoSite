'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { SUGGESTED_QUESTIONS, PORTFOLIO_DATA } from '@/lib/portfolio-context';
import { buttonTap } from '@/lib/animations';

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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-sm bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200"
      aria-label={copied ? 'Copied!' : 'Copy message'}
      title={copied ? 'Copied!' : 'Copy message'}
    >
      {copied ? (
        <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/5">
      <span className="text-[10px] text-gray-500 mr-1">Was this helpful?</span>
      <button
        onClick={() => onFeedback(messageId, 'positive')}
        className={`p-1 rounded transition-colors ${
          currentFeedback === 'positive'
            ? 'text-green-400 bg-green-400/10'
            : 'text-gray-500 hover:text-green-400 hover:bg-green-400/10'
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
            ? 'text-red-400 bg-red-400/10'
            : 'text-gray-500 hover:text-red-400 hover:bg-red-400/10'
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
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      {onViewResume && (
        <motion.button
          onClick={onViewResume}
          disabled={disabled}
          whileTap={!disabled ? buttonTap : undefined}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm bg-orange-500/20 border border-orange-500/30 text-orange-300 hover:bg-orange-500/30 hover:text-white transition-all duration-200 disabled:opacity-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          View Resume
        </motion.button>
      )}
      {onSeeProjects && (
        <motion.button
          onClick={onSeeProjects}
          disabled={disabled}
          whileTap={!disabled ? buttonTap : undefined}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 hover:text-white transition-all duration-200 disabled:opacity-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          See Projects
        </motion.button>
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

  const handleFeedback = useCallback((messageId: string, feedback: 'positive' | 'negative') => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, feedback: msg.feedback === feedback ? null : feedback }
          : msg
      )
    );
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

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

  // Expose sendMessage and clearChat to parent component
  useEffect(() => {
    if (onReady) {
      onReady({ send: sendMessage, clear: clearChat });
    }
  }, [onReady, sendMessage]);

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
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="relative group max-w-[85%]">
              <div
                className={`px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-violet-500 text-white rounded-sm'
                    : 'glass text-gray-200 rounded-sm'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="markdown-content">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                )}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] opacity-50">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {/* Feedback for assistant messages */}
                {message.role === 'assistant' && (
                  <FeedbackButtons
                    messageId={message.id}
                    currentFeedback={message.feedback}
                    onFeedback={handleFeedback}
                  />
                )}
              </div>
              {/* Copy button - appears on hover */}
              <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <CopyButton text={message.content} />
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="glass px-4 py-3 rounded-sm">
              <div className="flex items-center gap-1">
                <span className="typing-dot w-2 h-2 bg-violet-400 rounded-full" />
                <span className="typing-dot w-2 h-2 bg-violet-400 rounded-full" />
                <span className="typing-dot w-2 h-2 bg-violet-400 rounded-full" />
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-center">
            <span className="text-xs text-red-400">{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((question, index) => (
              <motion.button
                key={index}
                onClick={() => handleSuggestedQuestion(question)}
                disabled={isLoading}
                whileTap={!isLoading ? buttonTap : undefined}
                className="text-xs px-3 py-1.5 rounded-sm glass text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 disabled:opacity-50"
              >
                {question}
              </motion.button>
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

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-white/5">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-sm px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200 disabled:opacity-50"
          />
          <motion.button
            type="submit"
            disabled={isLoading || !input.trim()}
            whileTap={!(isLoading || !input.trim()) ? buttonTap : undefined}
            className="px-4 py-3 bg-violet-500 hover:bg-violet-400 active:bg-violet-600 text-white rounded-sm font-medium transition-all duration-200 hover:shadow-[0_0_20px_rgba(167,139,250,0.3)] disabled:opacity-50 disabled:hover:shadow-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </motion.button>
        </form>

      </div>
    </div>
  );
}

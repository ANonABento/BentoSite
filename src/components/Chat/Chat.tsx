'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/Toast';
import { useChatMessages, useChatSubmit } from './Chat.hooks';
import { ChatInput } from './parts/ChatInput';
import { CommandHints } from './parts/CommandHints';
import { MessageItem } from './parts/MessageItem';
import type { ChatbotProps } from './chat.types';
import { PORTFOLIO_DATA } from '@/lib/portfolio-context';

export default function Chatbot({
  onReady,
  onViewResume,
  onSeeProjects,
  onUserMessage,
}: ChatbotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { success: toastSuccess } = useToast();
  const {
    messages,
    messagesRef,
    setMessages,
    messagesEndRef,
    addAssistantMessage,
    clearChat,
  } = useChatMessages();
  const {
    input,
    setInput,
    isLoading,
    error,
    isDemoMode,
    sendMessage,
    clearError,
  } = useChatSubmit({
    inputRef,
    messagesRef,
    setMessages,
  });

  const handleCopied = useCallback(() => {
    toastSuccess('Copied to clipboard!');
  }, [toastSuccess]);

  const addAssistant = useCallback(
    (content: string) => {
      clearError();
      addAssistantMessage(content);
    },
    [addAssistantMessage, clearError]
  );

  const clear = useCallback(() => {
    clearError();
    clearChat();
  }, [clearChat, clearError]);

  const sendUserMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      onUserMessage?.();
      sendMessage(content);
    },
    [onUserMessage, sendMessage]
  );

  const sendUserMessageRef = useRef(sendUserMessage);
  const clearChatRef = useRef(clear);

  useEffect(() => {
    sendUserMessageRef.current = sendUserMessage;
  }, [sendUserMessage]);

  useEffect(() => {
    clearChatRef.current = clear;
  }, [clear]);

  useEffect(() => {
    if (onReady) {
      onReady({
        send: (content: string) => sendUserMessageRef.current(content),
        addAssistant,
        clear: () => clearChatRef.current(),
        focusInput: () => inputRef.current?.focus(),
      });
    }
  }, [addAssistant, onReady]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      sendUserMessage(input);
    },
    [input, sendUserMessage]
  );

  const handleSuggestedQuestion = useCallback(
    (question: string) => {
      sendUserMessage(question);
      inputRef.current?.focus();
    },
    [sendUserMessage]
  );

  return (
    <div className="flex flex-col h-full" role="region" aria-label="Chat assistant">
      {(isDemoMode || error) && (
        <div className="flex-shrink-0 px-4 py-2 bg-[var(--status-warning-muted)] border-b border-[var(--status-warning)]">
          <p className="text-xs font-mono text-[var(--status-warning)]">
            <span className="font-semibold">{error ? 'CHAT ERROR:' : 'HEADS UP:'}</span>{' '}
            {error
              ? 'something went wrong (rate limit, API issue, or service hiccup).'
              : "chat's in fallback mode — answers are limited."}{' '}
            For a direct reply, email{' '}
            <a
              href={`mailto:${PORTFOLIO_DATA.personal.email}`}
              className="underline underline-offset-2 hover:text-[var(--text-primary)]"
            >
              {PORTFOLIO_DATA.personal.email}
            </a>
            .
          </p>
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        aria-live="polite"
        aria-atomic="false"
        aria-label="Chat conversation"
        role="log"
      >
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            onCopySuccess={handleCopied}
          />
        ))}

        {isLoading && (
          <div className="pl-4 border-l-2 border-[var(--purple-muted)]">
            <span className="font-mono text-sm text-[var(--text-muted)]">
              processing<span className="animate-pulse">_</span>
            </span>
          </div>
        )}

        {error && (
          <div className="pl-4 border-l-2 border-[var(--status-error)]">
            <span className="text-xs font-mono text-[var(--status-error)]">ERR: {error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <CommandHints
        disabled={isLoading}
        onSelectQuestion={handleSuggestedQuestion}
        onViewResume={onViewResume}
        onSeeProjects={onSeeProjects}
        showSuggestions={messages.length <= 2}
      />

      <ChatInput
        input={input}
        isLoading={isLoading}
        inputRef={inputRef}
        onChange={setInput}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

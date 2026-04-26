'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/Toast';
import { useChatMessages, useChatSubmit } from './Chat.hooks';
import { ChatInput } from './parts/ChatInput';
import { MessageItem } from './parts/MessageItem';
import { QuickActions } from './parts/QuickActions';
import { SuggestedQuestions } from './parts/SuggestedQuestions';
import type { ChatbotProps } from './chat.types';

export default function Chatbot({ onReady, onViewResume, onSeeProjects }: ChatbotProps) {
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
    handleFeedback,
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

  const sendMessageRef = useRef(sendMessage);
  const clearChatRef = useRef(clear);

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  useEffect(() => {
    clearChatRef.current = clear;
  }, [clear]);

  useEffect(() => {
    if (onReady) {
      onReady({
        send: (content: string) => sendMessageRef.current(content),
        addAssistant,
        clear: () => clearChatRef.current(),
        focusInput: () => inputRef.current?.focus(),
      });
    }
  }, [addAssistant, onReady]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      sendMessage(input);
    },
    [input, sendMessage]
  );

  const handleSuggestedQuestion = useCallback(
    (question: string) => {
      sendMessage(question);
      inputRef.current?.focus();
    },
    [sendMessage]
  );

  return (
    <div className="flex flex-col h-full" role="region" aria-label="Chat assistant">
      {isDemoMode && (
        <div className="flex-shrink-0 px-4 py-2 bg-[var(--status-warning-muted)] border-b border-[var(--status-warning)]">
          <p className="text-xs font-mono text-[var(--status-warning)]">
            <span className="font-semibold">DEMO MODE:</span> AI responses are limited. Configure API key for full functionality.
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
            onFeedback={handleFeedback}
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

      {messages.length <= 2 && (
        <SuggestedQuestions disabled={isLoading} onSelect={handleSuggestedQuestion} />
      )}

      <QuickActions
        onViewResume={onViewResume}
        onSeeProjects={onSeeProjects}
        disabled={isLoading}
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

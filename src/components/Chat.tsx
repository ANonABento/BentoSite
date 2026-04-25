'use client';

import { SUGGESTED_QUESTIONS } from '@/lib/portfolio-context';
import { useToast } from '@/components/ui/Toast';
import { QuickActions } from '@/components/Chat/ChatMessageActions';
import { ChatInput } from '@/components/Chat/ChatInput';
import { ChatMessageList } from '@/components/Chat/ChatMessageList';
import type { ChatbotProps } from '@/components/Chat/chat.types';
import { useChatSession } from '@/components/Chat/useChatSession';

export type { ChatFunctions, ChatbotProps, Message } from '@/components/Chat/chat.types';

export default function Chatbot({
  onReady,
  onViewResume,
  onSeeProjects,
}: ChatbotProps) {
  const { success: toastSuccess } = useToast();
  const {
    messages,
    input,
    isLoading,
    error,
    isDemoMode,
    inputRef,
    messagesEndRef,
    setInput,
    handleSubmit,
    handleSuggestedQuestion,
    handleFeedback,
  } = useChatSession({ onReady });

  return (
    <div className="flex flex-col h-full" role="region" aria-label="Chat conversation">
      {isDemoMode ? (
        <div className="flex-shrink-0 px-4 py-2 bg-[var(--status-warning-muted)] border-b border-[var(--status-warning)]">
          <p className="text-xs font-mono text-[var(--status-warning)]">
            <span className="font-semibold">DEMO MODE:</span> AI responses are limited. Configure API key for full functionality.
          </p>
        </div>
      ) : null}

      <ChatMessageList
        messages={messages}
        isLoading={isLoading}
        error={error}
        onFeedback={handleFeedback}
        onCopySuccess={() => toastSuccess('Copied to clipboard!')}
        messagesEndRef={messagesEndRef}
      />

      {messages.length <= 2 ? (
        <div className="px-4 pb-2">
          <span className="text-[10px] font-mono text-[var(--text-muted)] mb-1.5 block">
            &gt; suggested queries:
          </span>
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
      ) : null}

      <QuickActions
        onViewResume={onViewResume}
        onSeeProjects={onSeeProjects}
        disabled={isLoading}
      />

      <ChatInput
        input={input}
        isLoading={isLoading}
        inputRef={inputRef}
        onInputChange={setInput}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

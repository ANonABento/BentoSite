'use client';

import { useToast } from '@/components/ui/Toast';
import { useHasMounted } from '@/lib/use-has-mounted';
import { useChatSession } from './Chat.hooks';
import { ChatInput } from './parts/ChatInput';
import { MessageItem } from './parts/MessageItem';
import { QuickActions } from './parts/QuickActions';
import { SuggestedQuestions } from './parts/SuggestedQuestions';
import type { ChatbotProps } from './Chat.types';

export default function Chatbot({ onReady, onViewResume, onSeeProjects }: ChatbotProps) {
  const { success: toastSuccess } = useToast();
  const hasMounted = useHasMounted();
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
      {isDemoMode && (
        <div className="flex-shrink-0 px-4 py-2 bg-[var(--status-warning-muted)] border-b border-[var(--status-warning)]">
          <p className="text-xs font-mono text-[var(--status-warning)]">
            <span className="font-semibold">DEMO MODE:</span> AI responses are limited. Configure API key for full functionality.
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite" aria-atomic="false">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            hasMounted={hasMounted}
            onCopySuccess={() => toastSuccess('Copied to clipboard!')}
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

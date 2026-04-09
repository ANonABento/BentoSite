'use client';

import { RefObject } from 'react';
import ReactMarkdown from 'react-markdown';
import { useHasMounted } from '@/lib/use-has-mounted';
import { Message } from './chat.types';
import { CopyButton, FeedbackButtons } from './ChatMessageActions';

interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onFeedback: (messageId: string, feedback: 'positive' | 'negative') => void;
  onCopySuccess: () => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

export function ChatMessageList({
  messages,
  isLoading,
  error,
  onFeedback,
  onCopySuccess,
  messagesEndRef,
}: ChatMessageListProps) {
  const hasMounted = useHasMounted();

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite" aria-atomic="false">
      {messages.map((message) => {
        const timeStr = hasMounted
          ? new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
          : '--:--';

        if (message.role === 'user') {
          return (
            <div key={message.id} className="group flex items-start gap-2">
              <span className="text-[var(--orange)] font-mono text-xs shrink-0 pt-0.5 select-none">
                <span className="text-[var(--text-muted)]">[{timeStr}]</span> anon@bentOS ~$
              </span>
              <p className="text-sm font-mono text-[var(--text-primary)] whitespace-pre-wrap">{message.content}</p>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                <CopyButton text={message.content} onCopied={onCopySuccess} />
              </div>
            </div>
          );
        }

        return (
          <div key={message.id} className="group pl-4 border-l-2 border-[var(--purple-muted)]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-[var(--text-muted)] select-none">[{timeStr}] sys:</span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <CopyButton text={message.content} onCopied={onCopySuccess} />
              </div>
            </div>
            <div className="markdown-content font-mono text-sm">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
            <FeedbackButtons
              messageId={message.id}
              currentFeedback={message.feedback}
              onFeedback={onFeedback}
            />
          </div>
        );
      })}

      {isLoading ? (
        <div className="pl-4 border-l-2 border-[var(--purple-muted)]">
          <span className="font-mono text-sm text-[var(--text-muted)]">
            processing<span className="animate-pulse">_</span>
          </span>
        </div>
      ) : null}

      {error ? (
        <div className="pl-4 border-l-2 border-[var(--status-error)]">
          <span className="text-xs font-mono text-[var(--status-error)]">ERR: {error}</span>
        </div>
      ) : null}

      <div ref={messagesEndRef} />
    </div>
  );
}

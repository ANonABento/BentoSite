'use client';

import { memo } from 'react';
import dynamic from 'next/dynamic';
import { useHasMounted } from '@/lib/use-has-mounted';
import type { Message } from '../chat.types';
import { CopyButton } from './CopyButton';
import { FeedbackButtons } from './FeedbackButtons';

const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false });

interface MessageItemProps {
  message: Message;
  onCopySuccess: () => void;
  onFeedback: (messageId: string, feedback: 'positive' | 'negative') => void;
}

export const MessageItem = memo(function MessageItem({
  message,
  onCopySuccess,
  onFeedback,
}: MessageItemProps) {
  const hasMounted = useHasMounted();
  const timeStr = hasMounted
    ? new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : '--:--';

  if (message.role === 'user') {
    return (
      <div className="group flex items-start gap-2">
        <span className="text-[var(--orange)] font-mono text-xs shrink-0 pt-0.5 select-none">
          <span className="text-[var(--text-muted)]">[{timeStr}]</span> anon@bentOS ~$
        </span>
        <p className="text-sm font-mono text-[var(--text-primary)] whitespace-pre-wrap">
          {message.content}
        </p>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
          <CopyButton text={message.content} onCopied={onCopySuccess} />
        </div>
      </div>
    );
  }

  return (
    <div className="group pl-4 border-l-2 border-[var(--purple-muted)]">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-mono text-[var(--text-muted)] select-none">
          [{timeStr}] sys:
        </span>
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
});

MessageItem.displayName = 'MessageItem';

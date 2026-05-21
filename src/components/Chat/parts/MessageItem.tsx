'use client';

import { memo } from 'react';
import dynamic from 'next/dynamic';
import type { Message } from '../chat.types';
import { CopyButton } from './CopyButton';

const ReactMarkdown = dynamic(() => import('react-markdown'), {
  ssr: false,
  loading: () => <span className="text-[var(--text-muted)]">...</span>,
});

interface MessageItemProps {
  message: Message;
  onCopySuccess: () => void;
}

export const MessageItem = memo(function MessageItem({
  message,
  onCopySuccess,
}: MessageItemProps) {
  if (message.role === 'user') {
    return (
      <div className="group flex items-start gap-2">
        <span className="text-[var(--purple)] font-mono text-xs shrink-0 pt-0.5 select-none">
          anon@bentOS ~$
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
          sys:
        </span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <CopyButton text={message.content} onCopied={onCopySuccess} />
        </div>
      </div>
      <div className="markdown-content font-mono text-sm">
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

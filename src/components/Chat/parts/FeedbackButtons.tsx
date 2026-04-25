'use client';

import { memo } from 'react';
import { ThumbsDownIcon, ThumbsUpIcon } from '@/components/ui/Icons';

interface FeedbackButtonsProps {
  messageId: string;
  currentFeedback?: 'positive' | 'negative' | null;
  onFeedback: (messageId: string, feedback: 'positive' | 'negative') => void;
}

export const FeedbackButtons = memo(function FeedbackButtons({
  messageId,
  currentFeedback,
  onFeedback,
}: FeedbackButtonsProps) {
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
});

FeedbackButtons.displayName = 'FeedbackButtons';

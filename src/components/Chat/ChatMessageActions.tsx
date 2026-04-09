'use client';

import { memo } from 'react';
import { useClipboard } from '@/lib/clipboard';
import {
  CheckIcon,
  CopyIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from '@/components/ui/Icons';

export const CopyButton = memo(function CopyButton({
  text,
  onCopied,
}: {
  text: string;
  onCopied?: () => void;
}) {
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
      className="p-1.5 rounded-sm bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200"
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
});

CopyButton.displayName = 'CopyButton';

export const FeedbackButtons = memo(function FeedbackButtons({
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
});

FeedbackButtons.displayName = 'FeedbackButtons';

export const QuickActions = memo(function QuickActions({
  onViewResume,
  onSeeProjects,
  disabled,
}: {
  onViewResume?: () => void;
  onSeeProjects?: () => void;
  disabled: boolean;
}) {
  if (!onViewResume && !onSeeProjects) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3 px-4 pb-2">
      {onViewResume ? (
        <button
          type="button"
          onClick={onViewResume}
          disabled={disabled}
          className="text-xs font-mono text-[var(--orange)] hover:underline transition-all duration-150 disabled:opacity-50"
        >
          [resume --download]
        </button>
      ) : null}
      {onSeeProjects ? (
        <button
          type="button"
          onClick={onSeeProjects}
          disabled={disabled}
          className="text-xs font-mono text-[var(--purple)] hover:underline transition-all duration-150 disabled:opacity-50"
        >
          [projects --list]
        </button>
      ) : null}
    </div>
  );
});

QuickActions.displayName = 'QuickActions';

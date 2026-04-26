'use client';

import { memo } from 'react';
import { useClipboard } from '@/lib/clipboard';
import { CheckIcon, CopyIcon } from '@/components/ui/Icons';

interface CopyButtonProps {
  text: string;
  onCopied?: () => void;
}

export const CopyButton = memo(function CopyButton({ text, onCopied }: CopyButtonProps) {
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

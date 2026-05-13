'use client';

import { memo } from 'react';
import { m } from 'framer-motion';
import { buttonTap } from '@/lib/animations';

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export const ChatInput = memo(function ChatInput({
  input,
  isLoading,
  inputRef,
  onChange,
  onSubmit,
}: ChatInputProps) {
  const isDisabled = isLoading || !input.trim();

  const hasContent = input.length > 0;

  return (
    <div
      className="flex-shrink-0 px-4 py-3"
      style={{ borderTop: '1px solid transparent', borderImage: 'linear-gradient(90deg, transparent, var(--border), transparent) 1' }}
    >
      <form onSubmit={onSubmit} className="flex items-center gap-2 group">
        <span
          className="text-[var(--orange)] font-mono text-sm shrink-0 select-none"
          aria-hidden="true"
        >
          $
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(event) => onChange(event.target.value)}
          placeholder="type a command..."
          disabled={isLoading}
          aria-label="Type your message"
          autoComplete="off"
          spellCheck={false}
          style={{ caretShape: 'block' } as React.CSSProperties}
          className="flex-1 min-w-0 bg-transparent border-none font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none caret-[var(--orange)] disabled:opacity-50"
        />
        <m.button
          type="submit"
          disabled={isDisabled}
          whileTap={!isDisabled ? buttonTap : undefined}
          className={
            'flex items-center justify-center w-8 h-8 rounded-md font-mono text-base transition-colors duration-150 ' +
            'border border-transparent ' +
            (hasContent && !isLoading
              ? 'text-[var(--orange)] border-[var(--orange)]/30 hover:border-[var(--orange)]/60 hover:bg-[var(--orange)]/10'
              : 'text-[var(--text-muted)] opacity-40 cursor-not-allowed')
          }
          aria-label="Send message"
          title="Send (Enter)"
        >
          <span aria-hidden="true">↵</span>
        </m.button>
      </form>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

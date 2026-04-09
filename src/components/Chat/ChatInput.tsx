'use client';

import { FormEvent, RefObject } from 'react';
import { m } from 'framer-motion';
import { buttonTap } from '@/lib/animations';

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onInputChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function ChatInput({
  input,
  isLoading,
  inputRef,
  onInputChange,
  onSubmit,
}: ChatInputProps) {
  const isDisabled = isLoading || !input.trim();

  return (
    <div
      className="flex-shrink-0 px-4 py-3"
      style={{
        borderTop: '1px solid transparent',
        borderImage: 'linear-gradient(90deg, transparent, var(--border), transparent) 1',
      }}
    >
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <span className="text-[var(--orange)] font-mono text-sm shrink-0 select-none">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="type a command..."
          disabled={isLoading}
          aria-label="Type your message"
          className="flex-1 bg-transparent border-none font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none caret-[var(--orange)] disabled:opacity-50"
        />
        <m.button
          type="submit"
          disabled={isDisabled}
          whileTap={!isDisabled ? buttonTap : undefined}
          className="px-3 py-1.5 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--orange)] transition-colors duration-150 disabled:opacity-30"
          aria-label="Send message"
        >
          [enter]
        </m.button>
      </form>
    </div>
  );
}

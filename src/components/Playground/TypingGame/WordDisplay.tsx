'use client';

import { useRef, useEffect } from 'react';

interface WordDisplayProps {
  text: string;
  currentIndex: number;
  errorIndices: Set<number>;
}

export function WordDisplay({ text, currentIndex, errorIndices }: WordDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  // Auto-scroll to keep cursor visible
  useEffect(() => {
    if (cursorRef.current && containerRef.current) {
      const cursor = cursorRef.current;
      const container = containerRef.current;
      const cursorRect = cursor.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Check if cursor is below visible area
      if (cursorRect.bottom > containerRect.bottom - 40) {
        container.scrollTop += cursorRect.bottom - containerRect.bottom + 60;
      }
    }
  }, [currentIndex]);

  return (
    <div
      ref={containerRef}
      className="font-mono text-lg sm:text-xl md:text-2xl leading-loose overflow-y-auto max-h-[40vh] select-none tracking-wide"
    >
      {text.split('').map((char, index) => {
        const isTyped = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isError = errorIndices.has(index);

        let className = 'relative transition-colors duration-75 ';

        if (isTyped) {
          if (isError) {
            // Error: red with subtle background
            className += 'text-[var(--pg-game-error)]';
          } else {
            // Correct: muted to reduce visual noise
            className += 'text-[var(--pg-text-muted)]';
          }
        } else if (isCurrent) {
          // Current character - highlighted
          className += 'text-[var(--pg-text-primary)]';
        } else {
          // Untyped
          className += 'text-[var(--pg-text-secondary)]/50';
        }

        // Handle space character visibility
        const displayChar = char === ' ' ? '\u00A0' : char;

        return (
          <span
            key={index}
            ref={isCurrent ? cursorRef : undefined}
            className={className}
          >
            {/* Caret before current character */}
            {isCurrent && (
              <span
                className="absolute left-0 top-0 w-[2px] h-[1.2em] bg-[var(--pg-accent-gold)] pg-caret -translate-x-[1px]"
                aria-hidden="true"
              />
            )}
            {/* Error underline */}
            {isTyped && isError && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--pg-game-error)]/60"
                aria-hidden="true"
              />
            )}
            {displayChar}
          </span>
        );
      })}
    </div>
  );
}

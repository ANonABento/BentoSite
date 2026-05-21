'use client';

import { memo, useMemo } from 'react';
import { SUGGESTED_QUESTION_POOL } from '@/lib/portfolio-context';

interface CommandHintsProps {
  disabled: boolean;
  onSelectQuestion: (question: string) => void;
  showSuggestions: boolean;
}

const VISIBLE_COUNT = 3;

const chipClass =
  'group/chip inline-flex items-center gap-1 text-xs font-mono text-[var(--text-secondary)] ' +
  'hover:text-[var(--text-primary)] transition-colors duration-150 disabled:opacity-40 ' +
  'disabled:cursor-not-allowed';

function pickRandom(pool: readonly string[], count: number): string[] {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

export const CommandHints = memo(function CommandHints({
  disabled,
  onSelectQuestion,
  showSuggestions,
}: CommandHintsProps) {
  const questions = useMemo(
    () => pickRandom(SUGGESTED_QUESTION_POOL, VISIBLE_COUNT),
    [],
  );

  if (!showSuggestions) {
    return null;
  }

  return (
    <div className="flex-shrink-0 px-4 pt-1 pb-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="text-[10px] font-mono text-[var(--text-muted)] select-none shrink-0">
          &gt; try:
        </span>

        {questions.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => onSelectQuestion(question)}
            disabled={disabled}
            aria-label={`Ask suggested question: ${question}`}
            className={chipClass}
          >
            <span className="text-[var(--text-muted)] group-hover/chip:text-[var(--purple)] transition-colors">
              $
            </span>
            <span className="group-hover/chip:underline underline-offset-2 decoration-[var(--purple)]">
              {question}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
});

CommandHints.displayName = 'CommandHints';

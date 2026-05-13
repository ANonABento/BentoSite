'use client';

import { memo } from 'react';
import { SUGGESTED_QUESTIONS } from '@/lib/portfolio-context';

interface CommandHintsProps {
  disabled: boolean;
  onSelectQuestion: (question: string) => void;
  onViewResume?: () => void;
  onSeeProjects?: () => void;
  showSuggestions: boolean;
}

const chipClass =
  'group/chip inline-flex items-center gap-1 text-xs font-mono text-[var(--text-secondary)] ' +
  'hover:text-[var(--text-primary)] transition-colors duration-150 disabled:opacity-40 ' +
  'disabled:cursor-not-allowed';

export const CommandHints = memo(function CommandHints({
  disabled,
  onSelectQuestion,
  onViewResume,
  onSeeProjects,
  showSuggestions,
}: CommandHintsProps) {
  const hasActions = Boolean(onViewResume || onSeeProjects);
  if (!showSuggestions && !hasActions) {
    return null;
  }

  return (
    <div className="flex-shrink-0 px-4 pt-1 pb-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="text-[10px] font-mono text-[var(--text-muted)] select-none shrink-0">
          &gt; try:
        </span>

        {onViewResume && (
          <button
            type="button"
            onClick={onViewResume}
            disabled={disabled}
            aria-label="Download resume from chat"
            className={chipClass}
          >
            <span className="text-[var(--text-muted)] group-hover/chip:text-[var(--orange)] transition-colors">
              $
            </span>
            <span className="group-hover/chip:underline underline-offset-2 decoration-[var(--orange)] text-[var(--orange)]">
              resume
            </span>
          </button>
        )}

        {onSeeProjects && (
          <button
            type="button"
            onClick={onSeeProjects}
            disabled={disabled}
            aria-label="View projects"
            className={chipClass}
          >
            <span className="text-[var(--text-muted)] group-hover/chip:text-[var(--orange)] transition-colors">
              $
            </span>
            <span className="group-hover/chip:underline underline-offset-2 decoration-[var(--orange)] text-[var(--orange)]">
              projects
            </span>
          </button>
        )}

        {showSuggestions && hasActions && (
          <span
            aria-hidden="true"
            className="text-[var(--text-muted)]/40 font-mono text-xs select-none"
          >
            |
          </span>
        )}

        {showSuggestions &&
          SUGGESTED_QUESTIONS.map((question) => (
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

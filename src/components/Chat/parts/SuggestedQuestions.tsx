'use client';

import { memo } from 'react';
import { SUGGESTED_QUESTIONS } from '@/lib/portfolio-context';

interface SuggestedQuestionsProps {
  disabled: boolean;
  onSelect: (question: string) => void;
}

export const SuggestedQuestions = memo(function SuggestedQuestions({
  disabled,
  onSelect,
}: SuggestedQuestionsProps) {
  return (
    <div className="px-4 pb-2">
      <span className="text-[10px] font-mono text-[var(--text-muted)] mb-1.5 block">
        &gt; suggested queries:
      </span>
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((question, index) => (
          <button
            key={index}
            onClick={() => onSelect(question)}
            disabled={disabled}
            aria-label={`Ask suggested question: ${question}`}
            className="text-xs font-mono px-2 py-1 text-[var(--purple)] hover:text-[var(--text-primary)] hover:underline transition-all duration-150 disabled:opacity-50 before:content-['$_'] before:text-[var(--text-muted)]"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
});

SuggestedQuestions.displayName = 'SuggestedQuestions';

'use client';

import { memo } from 'react';

interface QuickActionsProps {
  onViewResume?: () => void;
  onSeeProjects?: () => void;
  disabled: boolean;
}

export const QuickActions = memo(function QuickActions({
  onViewResume,
  onSeeProjects,
  disabled,
}: QuickActionsProps) {
  if (!onViewResume && !onSeeProjects) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3 px-4 pb-2">
      {onViewResume && (
        <button
          type="button"
          onClick={onViewResume}
          disabled={disabled}
          aria-label="Download resume from chat"
          className="text-xs font-mono text-[var(--ai)] hover:underline transition-all duration-150 disabled:opacity-50"
        >
          [resume --download]
        </button>
      )}
      {onSeeProjects && (
        <button
          type="button"
          onClick={onSeeProjects}
          disabled={disabled}
          aria-label="View Projects"
          className="text-xs font-mono text-[var(--ai)] hover:underline transition-all duration-150 disabled:opacity-50"
        >
          [projects --list]
        </button>
      )}
    </div>
  );
});

QuickActions.displayName = 'QuickActions';

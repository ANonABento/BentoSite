// TechBadge - Technology pill component for project cards

interface TechBadgeProps {
  tech: string;
  size?: 'sm' | 'md';
}

export function TechBadge({ tech, size = 'sm' }: TechBadgeProps) {
  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`
        ${sizeClasses}
        rounded-sm font-medium
        bg-[var(--glass-bg)] border border-[var(--border)]
        text-[var(--text-secondary)]
        transition-all duration-150
        hover:bg-[var(--glass-bg)] hover:border-violet-500/30 hover:text-[var(--text-primary)]
      `}
    >
      {tech}
    </span>
  );
}

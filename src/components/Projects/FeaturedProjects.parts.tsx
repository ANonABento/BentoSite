import type { ReactNode } from 'react';

interface FilterChipProps {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}

export function FilterChip({ active, children, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-[var(--interactive)] text-[var(--text-on-accent)]'
          : 'border border-[var(--border)] bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
      }`}
    >
      {children}
    </button>
  );
}

export function SectionStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--glass-bg)] px-4 py-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--text-muted)]">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{value}</div>
    </div>
  );
}

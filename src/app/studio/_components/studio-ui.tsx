'use client';

/**
 * Studio primitives. Deliberately plain: this is a local tool, so it borrows
 * the site's theme tokens for legibility and spends no effort beyond that.
 */

import type { ChangeEvent, ReactNode } from 'react';

export const inputClass =
  'w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--orange)]';

export const buttonClass =
  'rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--glass-bg)] disabled:cursor-not-allowed disabled:opacity-50';

export const primaryButtonClass =
  'rounded-md bg-[var(--orange)] px-3 py-2 text-sm font-medium text-[var(--text-on-accent)] transition-colors hover:bg-[var(--orange-hover)] disabled:cursor-not-allowed disabled:opacity-50';

export const dangerButtonClass =
  'rounded-md border border-[var(--status-error)]/40 px-3 py-2 text-sm font-medium text-[var(--status-error)] transition-colors hover:bg-[var(--status-error)]/10 disabled:opacity-50';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </span>
      {children}
      {hint ? <span className="block text-xs text-[var(--text-muted)]">{hint}</span> : null}
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        className={inputClass}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      />
    </Field>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 5,
  hint,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  rows?: number;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <textarea
        className={`${inputClass} font-mono text-xs leading-relaxed`}
        rows={rows}
        value={value}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
      />
    </Field>
  );
}

export function StatusBanner({
  status,
}: {
  status: { kind: 'idle' | 'busy' | 'ok' | 'error'; message: string; details?: string[] } | null;
}) {
  if (!status || status.kind === 'idle') return null;

  const tone =
    status.kind === 'error'
      ? 'border-[var(--status-error)]/40 text-[var(--status-error)]'
      : status.kind === 'ok'
        ? 'border-[var(--status-success)]/40 text-[var(--status-success)]'
        : 'border-[var(--border)] text-[var(--text-secondary)]';

  return (
    <div className={`rounded-md border px-3 py-2 text-sm ${tone}`} role="status">
      <p>{status.message}</p>
      {status.details?.length ? (
        <ul className="mt-1 list-disc pl-5 text-xs">
          {status.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Comma-separated list <-> string[] helpers used by several forms. */
export function listToText(list: string[] | undefined): string {
  return (list ?? []).join(', ');
}

export function textToList(text: string): string[] {
  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

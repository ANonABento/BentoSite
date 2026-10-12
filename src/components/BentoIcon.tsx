/** The bentOS mark: two orange compartments and a purple terminal one. */
export function BentoIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M3 0h7.5v24H3a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3Z" fill="var(--color-orange)" />
      <path d="M12.5 0H21a3 3 0 0 1 3 3v8h-11.5Z" fill="var(--color-orange)" />
      <path d="M12.5 13H24v8a3 3 0 0 1-3 3h-8.5Z" fill="var(--color-purple)" />
      <path d="m15.4 16.2 2.1 1.8-2.1 1.8M18.6 20.2h2.6" stroke="#fff" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

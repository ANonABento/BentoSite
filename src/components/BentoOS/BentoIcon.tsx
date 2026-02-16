'use client';

interface BentoIconProps {
  size?: number;
  className?: string;
}

export function BentoIcon({ size = 16, className = '' }: BentoIconProps) {
  const gap = Math.max(1, Math.round(size * 0.1));
  const cellW = (size - gap) / 2;
  const r = Math.max(1, Math.round(size * 0.15));

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      className={className}
      aria-hidden="true"
      style={{ borderRadius: r, overflow: 'hidden' }}
    >
      {/* Left — full-height rectangle (orange) */}
      <rect x={0} y={0} width={cellW} height={size} fill="var(--orange)" />
      {/* Top-right — purple */}
      <rect x={cellW + gap} y={0} width={cellW} height={cellW} fill="var(--purple)" />
      {/* Bottom-right — orange accent */}
      <rect x={cellW + gap} y={cellW + gap} width={cellW} height={cellW} fill="var(--orange)" />
    </svg>
  );
}

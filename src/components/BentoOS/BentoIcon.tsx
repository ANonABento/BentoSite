'use client';

import { useId } from 'react';

interface BentoIconProps {
  size?: number;
  className?: string;
}

export function BentoIcon({ size = 16, className = '' }: BentoIconProps) {
  const rawId = useId();
  const svgId = rawId.replace(/:/g, '');
  const gap = Math.max(1, Math.round(size * 0.08));
  const leftWidth = Math.round(size * 0.45);
  const rightX = leftWidth + gap;
  const rightWidth = size - rightX;
  const tileHeight = Math.round((size - gap) / 2);
  const r = Math.max(2, Math.round(size * 0.13));
  const terminalFontSize = Math.max(7, Math.round(size * 0.28));
  const promptX = rightX + rightWidth * 0.22;
  const promptY = tileHeight * 0.62;

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
      <defs>
        <filter id={`${svgId}-bento-icon-glow`} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="0" stdDeviation={Math.max(1, size * 0.035)} floodColor="var(--orange)" floodOpacity="0.45" />
          <feDropShadow dx="0" dy="0" stdDeviation={Math.max(1, size * 0.025)} floodColor="var(--purple)" floodOpacity="0.35" />
        </filter>
        <pattern id={`${svgId}-bento-icon-lines`} width="1" height={Math.max(3, size * 0.04)} patternUnits="userSpaceOnUse">
          <rect width="1" height="1" fill="rgba(255,255,255,0.16)" />
        </pattern>
      </defs>

      <g filter={`url(#${svgId}-bento-icon-glow)`}>
        <rect x={0} y={0} width={leftWidth} height={size} rx={r} fill="var(--orange)" />
        <rect x={rightX} y={0} width={rightWidth} height={tileHeight} rx={r * 0.75} fill="var(--purple)" />
        <rect
          x={rightX}
          y={tileHeight + gap}
          width={rightWidth}
          height={size - tileHeight - gap}
          rx={r * 0.75}
          fill="var(--orange)"
        />
        <text
          x={promptX}
          y={promptY}
          fill="rgba(255,255,255,0.92)"
          fontFamily="var(--font-mono), monospace"
          fontSize={terminalFontSize}
          fontWeight="700"
          dominantBaseline="middle"
        >
          &gt;_
        </text>
      </g>
      <rect width={size} height={size} fill={`url(#${svgId}-bento-icon-lines)`} opacity="0.42" />
    </svg>
  );
}

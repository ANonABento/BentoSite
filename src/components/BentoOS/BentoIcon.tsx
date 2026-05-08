'use client';

import { useId } from 'react';

interface BentoIconProps {
  size?: number;
  className?: string;
}

export function BentoIcon({ size = 16, className = '' }: BentoIconProps) {
  const rawId = useId();
  const svgId = rawId.replace(/:/g, '');
  const gap = Math.max(1, Math.round(size * 0.07));
  const leftWidth = Math.round(size * 0.45);
  const rightX = leftWidth + gap;
  const rightWidth = size - rightX;
  const tileHeight = Math.round((size - gap) / 2);
  // Sharper inner radii — the previous logo felt rounded/soft.
  const r = Math.max(2, Math.round(size * 0.07));
  const innerR = Math.max(1, Math.round(size * 0.05));

  // Bottom-right (purple) block geometry — used to fit the >_ glyph.
  const bottomY = tileHeight + gap;
  const bottomH = size - tileHeight - gap;
  const bottomCx = rightX + rightWidth / 2;
  const bottomCy = bottomY + bottomH / 2;
  // Scale glyph to fit ~70% of the smaller dimension of the box.
  const fit = Math.min(rightWidth, bottomH);
  const terminalFontSize = fit * 0.62;

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
        <pattern
          id={`${svgId}-bento-icon-lines`}
          width="1"
          height={Math.max(2, size * 0.035)}
          patternUnits="userSpaceOnUse"
        >
          <rect width="1" height="1" fill="rgba(255,255,255,0.18)" />
        </pattern>
      </defs>

      <rect x={0} y={0} width={leftWidth} height={size} rx={r} fill="var(--orange)" />
      <rect x={rightX} y={0} width={rightWidth} height={tileHeight} rx={innerR} fill="var(--orange)" />
      <rect
        x={rightX}
        y={bottomY}
        width={rightWidth}
        height={bottomH}
        rx={innerR}
        fill="var(--purple)"
      />
      <text
        x={bottomCx}
        y={bottomCy}
        fill="rgba(255,255,255,0.96)"
        fontFamily="var(--font-pixel), 'Pixelify Sans', monospace"
        fontSize={terminalFontSize}
        fontWeight="700"
        textAnchor="middle"
        dominantBaseline="central"
        letterSpacing="-0.04em"
      >
        &gt;_
      </text>
      <rect width={size} height={size} fill={`url(#${svgId}-bento-icon-lines)`} opacity="0.35" />
    </svg>
  );
}

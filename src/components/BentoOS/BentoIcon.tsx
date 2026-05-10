'use client';

import { useId } from 'react';

interface BentoIconProps {
  size?: number;
  className?: string;
}

interface CornerRadii {
  tl?: number;
  tr?: number;
  br?: number;
  bl?: number;
}

// Rect path with per-corner radii. Corners with radius 0 stay square — used to
// flatten the tiles' inner edges so they read as one outlined bento composition.
function tilePath(x: number, y: number, w: number, h: number, c: CornerRadii): string {
  const tl = c.tl ?? 0;
  const tr = c.tr ?? 0;
  const br = c.br ?? 0;
  const bl = c.bl ?? 0;
  const arc = (rx: number, ex: number, ey: number) =>
    rx > 0 ? `A${rx},${rx} 0 0 1 ${ex},${ey}` : `L${ex},${ey}`;
  return [
    `M${x + tl},${y}`,
    `L${x + w - tr},${y}`,
    arc(tr, x + w, y + tr),
    `L${x + w},${y + h - br}`,
    arc(br, x + w - br, y + h),
    `L${x + bl},${y + h}`,
    arc(bl, x, y + h - bl),
    `L${x},${y + tl}`,
    arc(tl, x + tl, y),
    'Z',
  ].join(' ');
}

export function BentoIcon({ size = 16, className = '' }: BentoIconProps) {
  const rawId = useId();
  const svgId = rawId.replace(/:/g, '');
  const gap = Math.max(1, Math.round(size * 0.07));
  const leftWidth = Math.round(size * 0.45);
  const rightX = leftWidth + gap;
  const rightWidth = size - rightX;
  const tileHeight = Math.round((size - gap) / 2);
  // Outer perimeter radius — inner corners stay square so the three tiles
  // read as one rounded bento outline.
  const r = Math.max(2, Math.round(size * 0.07));

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

      <path d={tilePath(0, 0, leftWidth, size, { tl: r, bl: r })} fill="var(--orange)" />
      <path
        d={tilePath(rightX, 0, rightWidth, tileHeight, { tr: r })}
        fill="var(--orange)"
      />
      <path
        d={tilePath(rightX, bottomY, rightWidth, bottomH, { br: r })}
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

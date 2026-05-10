'use client';

/**
 * MediaCard — shared shell for media-first cards (Photo / Project / Game).
 *
 * Layout:
 *   - children fill the card as the visual ("media").
 *   - shellExtras renders absolute decorative layers (e.g. scanlines, pixel corners).
 *   - topLeft / topRight / bottomLeft / bottomRight slots host badges/indicators.
 *   - title + metaLines render in a bottom gradient overlay that is:
 *       - always visible on mobile,
 *       - hidden until hover/focus on desktop.
 *
 * Subclasses (PhotoCard / ProjectCard / GameCard) keep their own theme-specific
 * shell style via `shellStyle` and any always-on decorations via `shellExtras`.
 */

import type { CSSProperties, ReactNode } from 'react';
import type { CardPosition, ThemeConfig } from '../BentoGrid.types';
import { BaseCard } from './BaseCard';
import { useCardHover } from './useCardHover';

export interface MediaCardProps {
  // BaseCard pass-through
  id: string;
  position: CardPosition;
  theme: ThemeConfig;
  isFocused?: boolean;
  entranceIndex?: number;
  onClick?: () => void;
  href?: string;
  ariaLabel?: string;

  /** Visual that fills the card (image, icon, fallback). Receives `group` on shell. */
  children: ReactNode;

  /** Title shown in the hover-revealed overlay. */
  title: ReactNode;
  /** Optional content under the title (description, badges, score). */
  metaLines?: ReactNode;

  /** Always-visible decorative absolute layers (scanlines, pixel corners, accent strip). */
  shellExtras?: ReactNode;

  /** Corner slot — badges/indicators rendered above the media. */
  topLeft?: ReactNode;
  topRight?: ReactNode;
  bottomLeft?: ReactNode;
  bottomRight?: ReactNode;

  /** Theme-specific shell border/shadow override. */
  shellStyle?: CSSProperties;
  /** Extra classes appended to the shell (always includes `group relative`). */
  shellClassName?: string;

  /**
   * Reports the live hover state up to the parent so consumers can swap
   * theme-specific styles. Optional — most cards just rely on CSS group-hover.
   */
  onHoverChange?: (isHovered: boolean) => void;
}

const OVERLAY_BASE_CLASS =
  'pointer-events-none absolute inset-x-0 bottom-0 z-[5] bg-gradient-to-t from-black/85 via-black/45 to-transparent p-3 transition-opacity duration-300';

export function MediaCard({
  id,
  position,
  theme,
  isFocused = false,
  entranceIndex,
  onClick,
  href,
  ariaLabel,
  children,
  title,
  metaLines,
  shellExtras,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  shellStyle,
  shellClassName,
  onHoverChange,
}: MediaCardProps) {
  const { isHovered, onHoverStart, onHoverEnd } = useCardHover();

  const handleHoverStart = () => {
    onHoverStart();
    onHoverChange?.(true);
  };
  const handleHoverEnd = () => {
    onHoverEnd();
    onHoverChange?.(false);
  };

  const isHighlighted = isHovered || isFocused;
  const defaultShellStyle: CSSProperties = {
    border: isHighlighted
      ? `1px solid ${theme.accent.primary}40`
      : theme.card.border,
    boxShadow: isFocused
      ? `0 0 0 3px ${theme.accent.primary}, ${theme.card.hoverShadow}`
      : isHovered
        ? theme.card.hoverShadow
        : theme.card.shadow,
  };

  // Focus must reveal the overlay (a11y) — keyboard users can't hover.
  const overlayClass = isFocused
    ? `${OVERLAY_BASE_CLASS} opacity-100`
    : `${OVERLAY_BASE_CLASS} opacity-100 md:opacity-0 md:group-hover:opacity-100`;

  return (
    <BaseCard
      id={id}
      position={position}
      theme={theme}
      isFocused={isFocused}
      entranceIndex={entranceIndex}
      onClick={onClick}
      href={href}
      ariaLabel={ariaLabel}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      shellClassName={['group relative', shellClassName].filter(Boolean).join(' ')}
      shellStyle={shellStyle ?? defaultShellStyle}
    >
      {/* Media layer */}
      <div className="absolute inset-0 overflow-hidden">{children}</div>

      {/* Decorative absolute layers (scanlines, pixel corners, accent strip) */}
      {shellExtras}

      {/* Hover-revealed overlay (always visible on mobile + when focused) */}
      <div className={overlayClass}>
        <div className="text-sm font-semibold text-white line-clamp-2">{title}</div>
        {metaLines ? <div className="mt-1 space-y-1 text-xs text-white/70">{metaLines}</div> : null}
      </div>

      {/* Corner slots — above media + overlay */}
      {topLeft ? <div className="absolute top-2 left-2 z-10">{topLeft}</div> : null}
      {topRight ? <div className="absolute top-2 right-2 z-10">{topRight}</div> : null}
      {bottomLeft ? <div className="absolute bottom-2 left-2 z-10">{bottomLeft}</div> : null}
      {bottomRight ? <div className="absolute bottom-2 right-2 z-10">{bottomRight}</div> : null}
    </BaseCard>
  );
}

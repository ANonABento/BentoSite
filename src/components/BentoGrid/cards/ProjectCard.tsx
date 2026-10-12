'use client';

/**
 * ProjectCard — image compartment over a solid footer.
 *
 * The footer carries the title, the category (in its own hue) and the date,
 * or `wip` for work in progress, so the grid scans without hovering and the
 * text never sits on top of a busy screenshot, plus the one-line
 * description. The award star sits in the image's corner. Card
 * click navigates; github/demo links live on the project page.
 */

import { useState } from 'react';
import Image from 'next/image';
import type { ProjectCardData, CardPosition, ThemeConfig } from '../BentoGrid.types';
import { BaseCard } from './BaseCard';
import { useCardHover } from './useCardHover';

export interface ProjectCardProps {
  card: ProjectCardData;
  position: CardPosition;
  theme: ThemeConfig;
  onClick?: () => void;
  href?: string;
  /** Whether the card has keyboard focus */
  isFocused?: boolean;
  /** Visible-order index used for entrance staggering */
  entranceIndex?: number;
}

/** Featured (3-wide) compartments get the larger title. */
const BIG_CARD_WIDTH = 600;

function categoryColor(category?: string): string {
  if (!category) return 'var(--color-ash)';
  return `var(--cat-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}, var(--color-ash))`;
}

export function ProjectCard({
  card,
  position,
  theme,
  onClick,
  href,
  isFocused = false,
  entranceIndex = 0,
}: ProjectCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { isHovered, onHoverStart, onHoverEnd } = useCardHover();
  const big = position.width >= BIG_CARD_WIDTH;
  const hue = categoryColor(card.category);
  const highlighted = isHovered || isFocused;

  return (
    <BaseCard
      id={card.id}
      position={position}
      theme={theme}
      isFocused={isFocused}
      entranceIndex={entranceIndex}
      onClick={onClick}
      href={href}
      ariaLabel={`Open ${card.title}`}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      shellClassName="group relative flex flex-col"
      shellStyle={{
        border: highlighted ? `1px solid ${hue}` : theme.card.border,
        boxShadow: isFocused ? `0 0 0 3px ${theme.accent.primary}, ${theme.card.hoverShadow}` : theme.card.shadow,
      }}
    >
      <div className="relative min-h-0 flex-1 overflow-hidden bg-cell-raised">
        {card.thumbnail ? (
          <Image
            src={card.thumbnail}
            alt={card.title}
            fill
            className={`object-cover transition-[opacity,transform] duration-500 group-hover:scale-[1.04] ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            sizes={`${Math.round(position.width * 1.5)}px`}
            draggable={false}
          />
        ) : (
          // No image yet: a CRT screen with the project's name, so the card still reads.
          <div className="crt absolute inset-0 flex items-center justify-center p-4 text-center text-[1.7rem] leading-tight">
            <span>
              <span style={{ color: hue }}>&gt;</span> {card.title.toLowerCase()}
              <span className="cursor ml-1" />
            </span>
          </div>
        )}
        {card.award && (
          <span
            className="absolute right-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] leading-none text-orange backdrop-blur-sm"
            title={card.award}
          >
            ★
          </span>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-1 px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3
            className={`truncate font-semibold tracking-tight text-rice transition-colors ${big ? 'text-lg' : 'text-base'}`}
            style={highlighted ? { color: hue } : undefined}
          >
            {card.title}
          </h3>
          <span className="shrink-0 font-crt text-[0.95rem] leading-none text-ash">
            {card.status === 'In Progress' ? <span className="text-purple">wip</span> : card.date?.toLowerCase()}
          </span>
        </div>
        {card.description ? (
          <p className="line-clamp-1 text-sm leading-snug text-ash">{card.description}</p>
        ) : null}
        <p className="flex items-center gap-1.5 truncate text-[0.7rem] font-medium uppercase tracking-[0.08em]" style={{ color: hue }}>
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: hue }} />
          {card.category}
        </p>
      </div>
    </BaseCard>
  );
}

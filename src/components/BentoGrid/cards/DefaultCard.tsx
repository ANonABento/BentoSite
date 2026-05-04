'use client';

import type { CardData, CardPosition, ThemeConfig } from '../BentoGrid.types';
import { BaseCard } from './BaseCard';

interface DefaultCardProps {
  card: CardData;
  position: CardPosition;
  theme: ThemeConfig;
  onClick?: () => void;
  href?: string;
  isFocused?: boolean;
  entranceIndex?: number;
}

export function DefaultCard({
  card,
  position,
  theme,
  onClick,
  href,
  isFocused,
  entranceIndex,
}: DefaultCardProps) {
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
    >
      <div className="p-4 h-full flex flex-col">
        <h3 className="font-bold text-[var(--foreground)] text-lg truncate">{card.title}</h3>
        {card.description && (
          <p className="text-sm text-[var(--muted-foreground)] mt-2 line-clamp-2">
            {card.description}
          </p>
        )}
        {card.category && (
          <span
            className="mt-auto inline-block px-2 py-1 text-xs rounded-full w-fit"
            style={{
              background: `${theme.accent.primary}20`,
              color: theme.accent.primary,
            }}
          >
            {card.category}
          </span>
        )}
      </div>
    </BaseCard>
  );
}

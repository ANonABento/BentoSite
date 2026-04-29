'use client';

import type { CardData, CardPosition, ThemeConfig } from '../BentoGrid.types';
import { BaseCard } from './BaseCard';

export interface DefaultCardProps {
  card: CardData;
  position: CardPosition;
  theme: ThemeConfig;
  onClick?: () => void;
  isFocused?: boolean;
  entranceIndex?: number;
}

export function DefaultCard({
  card,
  position,
  theme,
  onClick,
  isFocused = false,
  entranceIndex = 0,
}: DefaultCardProps) {
  return (
    <BaseCard
      position={position}
      theme={theme}
      onClick={onClick}
      isFocused={isFocused}
      entranceIndex={entranceIndex}
    >
      <div className="flex h-full flex-col p-4">
        <h3 className="truncate text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          {card.title}
        </h3>
        {card.description && (
          <p className="mt-2 line-clamp-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            {card.description}
          </p>
        )}
        {card.category && (
          <span
            className="mt-auto inline-block w-fit rounded-full px-2 py-1 text-xs"
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

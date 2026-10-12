'use client';

/**
 * InfoCard — the non-project compartment: the skills list, under the search card.
 */

import type { CardPosition, InfoCardData, ThemeConfig } from '../BentoGrid.types';
import { BaseCard } from './BaseCard';

export interface InfoContent {
  skills: string[];
}

export interface InfoCardProps {
  card: InfoCardData;
  position: CardPosition;
  theme: ThemeConfig;
  content: InfoContent;
  isFocused?: boolean;
  onClick?: () => void;
  entranceIndex?: number;
}

export function InfoCard({ card, position, theme, content, isFocused, onClick, entranceIndex }: InfoCardProps) {
  const shared = { id: card.id, position, theme, isFocused, entranceIndex };

  return (
    <BaseCard {...shared} hoverEnabled={false} ariaLabel="Skills">
      <div className="flex h-full flex-col gap-3 p-5">
        <h2 className="text-sm text-ash">Skills</h2>
        <p className="line-clamp-5 font-crt text-lg leading-tight text-rice/80">{content.skills.join(' · ').toLowerCase()}</p>
      </div>
    </BaseCard>
  );
}

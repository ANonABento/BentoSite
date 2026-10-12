'use client';

/**
 * InfoCard — the non-project compartment: an about blurb with skills.
 */

import type { CardPosition, InfoCardData, ThemeConfig } from '../BentoGrid.types';
import { BaseCard } from './BaseCard';

export interface InfoContent {
  about: string;
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
    <BaseCard {...shared} hoverEnabled={false} ariaLabel="About">
      <div className="flex h-full flex-col justify-between gap-3 p-5">
        <p className="line-clamp-4 shrink-0 text-sm leading-snug text-rice/80">{content.about}</p>
        <p className="line-clamp-2 font-crt text-base leading-tight text-ash">{content.skills.join(' · ').toLowerCase()}</p>
      </div>
    </BaseCard>
  );
}

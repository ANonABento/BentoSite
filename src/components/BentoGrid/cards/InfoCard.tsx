'use client';

/**
 * InfoCard — the non-project compartment under the search card: resume and contact links.
 */

import type { CardPosition, InfoCardData, ThemeConfig } from '../BentoGrid.types';
import { BaseCard } from './BaseCard';

const ext = { target: '_blank', rel: 'noopener noreferrer' } as const;

export interface InfoContent {
  links: { resume: string; github: string; linkedin: string; email: string };
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
    <BaseCard {...shared} hoverEnabled={false} ariaLabel="Contact">
      <div className="flex h-full flex-col justify-between p-5" data-no-drag>
        <h2 className="text-sm text-ash">Get in touch</h2>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
          <a
            href={content.links.resume}
            {...ext}
            className="rounded-full bg-orange px-4 py-2 font-medium text-lacquer transition-[filter] hover:brightness-110"
          >
            Resume
          </a>
          <a href={content.links.github} {...ext} className="text-ash hover:text-rice">
            GitHub
          </a>
          <a href={content.links.linkedin} {...ext} className="text-ash hover:text-rice">
            LinkedIn
          </a>
          <a href={`mailto:${content.links.email}`} className="text-ash hover:text-rice">
            Email
          </a>
        </div>
      </div>
    </BaseCard>
  );
}

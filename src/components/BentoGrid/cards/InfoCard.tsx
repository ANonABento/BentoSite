'use client';

/**
 * InfoCard — the non-project compartments: work history, an about blurb with
 * skills, and small CRT tech tiles that plug the holes between projects.
 * Tech tiles carry a `filter` term, so selecting one searches the board.
 */

import type { CardPosition, InfoCardData, ThemeConfig } from '../BentoGrid.types';
import { BaseCard } from './BaseCard';

export interface InfoContent {
  jobs: { role: string; company: string; period: string }[];
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

  if (card.variant === 'tech') {
    return (
      <BaseCard {...shared} onClick={onClick} ariaLabel={`Show projects using ${card.title}`}>
        <div className="crt flex h-full w-full flex-col items-start justify-between p-4 text-left">
          <span className="text-lg text-orange">×{card.count}</span>
          <span className="w-full break-words text-[1.6rem] leading-none">{card.title.toLowerCase()}</span>
        </div>
      </BaseCard>
    );
  }

  if (card.variant === 'experience') {
    return (
      <BaseCard {...shared} hoverEnabled={false} ariaLabel="Experience">
        <div className="flex h-full flex-col p-5">
          <h2 className="text-sm text-ash">Experience</h2>
          <ol className="mt-3 flex flex-1 flex-col justify-between gap-2">
            {content.jobs.map((job) => (
              <li key={job.company}>
                <p className="font-crt text-base leading-none text-ash">{job.period.toLowerCase()}</p>
                <p className="mt-0.5 text-sm leading-snug text-rice">
                  <span className="font-semibold">{job.role}</span> <span className="text-ash">at</span> {job.company}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </BaseCard>
    );
  }

  return (
    <BaseCard {...shared} hoverEnabled={false} ariaLabel="About">
      <div className="flex h-full flex-col justify-between gap-3 p-5">
        <p className="line-clamp-4 shrink-0 text-sm leading-relaxed text-rice/80 md:line-clamp-6">{content.about}</p>
        <p className="font-crt text-base leading-tight text-ash">{content.skills.join(' · ').toLowerCase()}</p>
      </div>
    </BaseCard>
  );
}

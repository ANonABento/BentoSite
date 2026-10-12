'use client';

/**
 * IntroCard — the pinned identity compartment that opens beside the search
 * card: name, one-line pitch and links, with work history alongside.
 */

import type { CardPosition, IntroCardData, ThemeConfig } from '../BentoGrid.types';
import { BaseCard } from './BaseCard';

export interface IntroProfile {
  name: string;
  title: string;
  pitch: string;
  jobs: { role: string; company: string; period: string }[];
  links: { resume: string; github: string; linkedin: string; email: string };
}

export interface IntroCardProps {
  card: IntroCardData;
  position: CardPosition;
  theme: ThemeConfig;
  profile: IntroProfile;
  isFocused?: boolean;
}

const ext = { target: '_blank', rel: 'noopener noreferrer' } as const;

export function IntroCard({ card, position, theme, profile, isFocused }: IntroCardProps) {
  // Stack the halves when the card is narrower than it is tall (mobile).
  const stacked = position.width < position.height * 1.2;

  return (
    <BaseCard
      id={card.id}
      position={position}
      theme={theme}
      isFocused={isFocused}
      hoverEnabled={false}
      ariaLabel={`${profile.name}, ${profile.title}`}
    >
      <div className={`flex h-full ${stacked ? 'flex-col' : 'flex-row'}`}>
        <div className="flex min-w-0 flex-[1.15] flex-col justify-between gap-4 p-6">
          <div>
            <h1 className="text-[2.6rem] font-semibold leading-none tracking-[-0.035em] text-rice">{profile.name}</h1>
            <p className="mt-3 max-w-[28ch] text-[0.95rem] leading-snug text-rice/80">{profile.pitch}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm" data-no-drag>
            <a
              href={profile.links.resume}
              {...ext}
              className="rounded-full bg-orange px-3.5 py-1.5 font-medium text-lacquer transition-[filter] hover:brightness-110"
            >
              Resume
            </a>
            <a href={profile.links.github} {...ext} className="text-ash hover:text-rice">
              GitHub
            </a>
            <a href={profile.links.linkedin} {...ext} className="text-ash hover:text-rice">
              LinkedIn
            </a>
            <a href={`mailto:${profile.links.email}`} className="text-ash hover:text-rice">
              Email
            </a>
          </div>
        </div>
        <section
          aria-label="Experience"
          className={`flex min-w-0 flex-1 flex-col bg-black/20 p-5 ${stacked ? 'border-t' : 'border-l'} border-white/5`}
        >
          <h2 className="text-sm text-ash">Experience</h2>
          <ol className="mt-3 flex flex-1 flex-col justify-between gap-3">
            {profile.jobs.map((job) => (
              <li key={`${job.company}-${job.period}`}>
                <p className="font-crt text-base leading-none text-ash">{job.period.toLowerCase()}</p>
                <p className="mt-1 text-sm leading-snug text-rice">
                  <span className="font-semibold">{job.role}</span> <span className="text-ash">at</span> {job.company}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </BaseCard>
  );
}

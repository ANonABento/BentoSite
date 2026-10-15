'use client';

/**
 * IntroCard — the pinned identity compartment that opens beside the search
 * card: name, role, pitch, the facts a recruiter screens on, awards and skills,
 * with recent work history alongside.
 */

import type { CardPosition, IntroCardData, ThemeConfig } from '../BentoGrid.types';
import { BaseCard } from './BaseCard';

export interface IntroProfile {
  name: string;
  /** The role headline under the name. */
  title: string;
  pitch: string;
  /** Short facts a recruiter screens on: location, school, work authorization. */
  facts: string[];
  /** Awards worth seeing without opening a card. */
  highlights: { id: string; label: string }[];
  jobs: { role: string; company: string; note?: string; period: string; summary: string }[];
  skills: string[];
}

export interface IntroCardProps {
  card: IntroCardData;
  position: CardPosition;
  theme: ThemeConfig;
  profile: IntroProfile;
  isFocused?: boolean;
}

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
        <div className="flex min-w-0 flex-[1.1] flex-col justify-between gap-3 p-5">
          <div>
            <h1 className="text-[2.4rem] font-semibold leading-none tracking-[-0.035em] text-rice">{profile.name}</h1>
            <p className="mt-2 text-[0.95rem] font-medium text-orange">{profile.title}</p>
            <p className="mt-2 text-[0.85rem] leading-snug text-rice/75">{profile.pitch}</p>
            <p className="mt-2.5 whitespace-pre-wrap text-[0.72rem] leading-relaxed text-ash">{profile.facts.join('  ·  ')}</p>
          </div>
          <div className="flex flex-col gap-2.5">
            {profile.highlights.length > 0 && (
              <ul aria-label="Awards" className="flex flex-col gap-1">
                {profile.highlights.map((h) => (
                  <li key={h.id} className="truncate text-[0.72rem] leading-tight text-rice/85">
                    <span className="mr-1.5 text-orange">★</span>
                    {h.label}
                  </li>
                ))}
              </ul>
            )}
            <ul aria-label="Skills" className="flex flex-wrap gap-1">
              {profile.skills.map((skill) => (
                <li key={skill} className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[0.68rem] leading-tight text-rice/70">
                  {skill}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <section
          aria-label="Experience"
          className={`flex min-w-0 flex-1 flex-col bg-black/20 p-5 ${stacked ? 'border-t' : 'border-l'} border-white/5`}
        >
          <h2 className="text-sm text-ash">Experience</h2>
          <ol className="mt-2.5 flex flex-1 flex-col justify-between gap-2.5">
            {profile.jobs.map((job) => (
              <li key={`${job.company}-${job.period}`}>
                <p className="font-crt text-[0.95rem] leading-none text-ash">{job.period.toLowerCase()}</p>
                <p className="mt-0.5 text-[0.82rem] leading-snug text-rice">
                  <span className="font-semibold">{job.role}</span> <span className="text-ash">at</span> {job.company}
                  {job.note && <span className="ml-1.5 rounded bg-orange/15 px-1 text-[0.65rem] text-orange">{job.note}</span>}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[0.7rem] leading-snug text-ash">{job.summary}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </BaseCard>
  );
}

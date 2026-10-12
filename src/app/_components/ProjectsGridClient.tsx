'use client';

import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { PaletteSwitcher } from './PaletteSwitcher';
import { InfoCard, IntroCard, ProjectCard, type InfoContent, type IntroProfile } from '@/components/BentoGrid/cards';
import { duplicateCardsForFill, stripCloneSuffix } from '@/components/BentoGrid/duplicate-fill';
import {
  BentoGrid,
  type CardData,
  type CardPosition,
  type InfoCardData,
  type IntroCardData,
  type ProjectCardData,
  type ThemeConfig,
} from '@/components/BentoGrid';

const INTRO: IntroCardData = { id: 'intro', type: 'intro', title: 'Kevin Jiang', size: '3x2' };
const EXPERIENCE: InfoCardData = {
  id: 'experience',
  type: 'info',
  variant: 'experience',
  title: 'Experience',
  size: '2x2',
  pinned: true,
};
const ABOUT: InfoCardData = { id: 'about', type: 'info', variant: 'about', title: 'About', size: '2x2', pinned: true };

export interface ProjectsGridProps {
  projects: ProjectCardData[];
  profile: IntroProfile;
  info: InfoContent;
  /** Technologies used by two or more projects, most-used first. */
  techs: { name: string; count: number }[];
}

function makeRenderCard(profile: IntroProfile, info: InfoContent) {
  return function renderProjectCard(
    card: CardData,
    position: CardPosition,
    theme: ThemeConfig,
    isFocused?: boolean,
    onClick?: () => void,
    entranceIndex = 0,
  ): ReactNode {
    if (card.type === 'intro') {
      return <IntroCard card={card} position={position} theme={theme} profile={profile} isFocused={isFocused} />;
    }
    if (card.type === 'info') {
      return (
        <InfoCard
          card={card}
          position={position}
          theme={theme}
          content={info}
          isFocused={isFocused}
          onClick={onClick}
          entranceIndex={entranceIndex}
        />
      );
    }
    if (card.type !== 'project') {
      return null;
    }

    return (
      <ProjectCard
        card={card}
        position={position}
        theme={theme}
        isFocused={isFocused}
        onClick={onClick}
        entranceIndex={entranceIndex}
      />
    );
  };
}

export function ProjectsGridClient({ projects, profile, info, techs }: ProjectsGridProps) {
  const router = useRouter();
  // Fill the canvas — cycle the source pool with clone IDs so the
  // grid feels populated even when the project count is small. The intro
  // and info compartments are pinned, so they go in once, ahead of the pool.
  // Tech tiles plug the holes between projects; selecting one searches for it.
  const cards = useMemo<CardData[]>(() => {
    const tiles = techs.map(
      (tech): InfoCardData => ({
        id: `tech-${tech.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        type: 'info',
        variant: 'tech',
        title: tech.name,
        count: tech.count,
        size: '1x1',
        filler: true,
        filter: tech.name,
      }),
    );
    return [INTRO, EXPERIENCE, ABOUT, ...duplicateCardsForFill(projects), ...tiles];
  }, [projects, techs]);
  const renderCard = useMemo(() => makeRenderCard(profile, info), [profile, info]);

  const handleCardSelect = useCallback(
    (card: CardData) => {
      // Clones share the source project's id under a `-clone-N` suffix;
      // strip it before navigating to the project page.
      if (card.type === 'project') router.push(`/projects/${stripCloneSuffix(card.id)}`);
    },
    [router],
  );

  return (
    <>
      <BentoGrid
        theme="premium"
        cards={cards}
        cardSizeMode="detail"
        onCardSelect={handleCardSelect}
        breadcrumb="bentOS / Kevin Jiang"
        renderCard={renderCard}
      />
      <PaletteSwitcher />
    </>
  );
}

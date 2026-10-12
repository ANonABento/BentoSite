'use client';

import { useCallback, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { PaletteSwitcher } from './PaletteSwitcher';
import { InfoCard, IntroCard, ProjectCard, type InfoContent, type IntroProfile } from '@/components/BentoGrid/cards';
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
const ABOUT: InfoCardData = { id: 'about', type: 'info', variant: 'about', title: 'About', size: '2x1', pinned: true };

export interface ProjectsGridProps {
  projects: ProjectCardData[];
  profile: IntroProfile;
  info: InfoContent;
  /** Called once the board has mounted. */
  onReady?: () => void;
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

export function ProjectsGridClient({ projects, profile, info, onReady }: ProjectsGridProps) {
  const router = useRouter();
  useEffect(() => onReady?.(), [onReady]);
  // Every card goes on the board once; the board repeats it in every direction.
  const cards = useMemo<CardData[]>(() => [INTRO, ABOUT, ...projects], [projects]);
  const renderCard = useMemo(() => makeRenderCard(profile, info), [profile, info]);

  const handleCardSelect = useCallback(
    (card: CardData) => {
      if (card.type === 'project') router.push(`/projects/${card.id}`);
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

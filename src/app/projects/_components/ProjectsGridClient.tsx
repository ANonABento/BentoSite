'use client';

import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PROJECTS } from '@/lib/projects-data';
import { ProjectCard } from '@/components/BentoGrid/cards';
import { createSeedProjectCards, shouldUseBentoGridSeed } from '@/components/BentoGrid/debugSeed';
import {
  duplicateCardsForFill,
  stripCloneSuffix,
} from '@/components/BentoGrid/duplicate-fill';
import {
  BentoGrid,
  type CardData,
  type CardPosition,
  type ProjectCardData,
  type ThemeConfig,
} from '@/components/BentoGrid';

function mapProjectToCardData(project: typeof PROJECTS[number]): ProjectCardData {
  return {
    id: project.id,
    type: 'project',
    title: project.name,
    description: project.shortDescription,
    thumbnail: project.thumbnail,
    category: project.category,
    technologies: project.technologies,
    status: project.status,
    links: {
      github: project.links.github,
      demo: project.links.liveDemo,
      modelPath: project.links.modelPath,
    },
    featured: project.featured,
  };
}

function renderProjectCard(
  card: CardData,
  position: CardPosition,
  theme: ThemeConfig,
  isFocused?: boolean,
  onClick?: () => void,
  entranceIndex = 0
): ReactNode {
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
}

export function ProjectsGridClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectCards = useMemo(() => {
    const cards = PROJECTS.map(mapProjectToCardData);
    if (shouldUseBentoGridSeed(searchParams)) return createSeedProjectCards(cards);
    // Fill the canvas — cycle the source pool with clone IDs so the
    // grid feels populated even when the project count is small.
    return duplicateCardsForFill(cards);
  }, [searchParams]);

  const handleCardSelect = useCallback(
    (card: CardData) => {
      if (card.type === 'project') {
        if (card.id.startsWith('seed-project-')) return;
        // Clones share the source project's id under a `-clone-N` suffix;
        // strip it before navigating to the project page.
        router.push(`/?project=${stripCloneSuffix(card.id)}`);
      }
    },
    [router]
  );

  const handleBack = useCallback(() => {
    router.push('/');
  }, [router]);

  return (
    <BentoGrid
      theme="premium"
      cards={projectCards}
      cardSizeMode="detail"
      onCardSelect={handleCardSelect}
      onBack={handleBack}
      breadcrumb="bentOS / projects"
      renderCard={renderProjectCard}
    />
  );
}

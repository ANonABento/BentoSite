'use client';

import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { PROJECTS } from '@/lib/projects-data';
import { ProjectCard } from '@/components/BentoGrid/cards';
import { createSeedProjectCards, shouldUseBentoGridSeed } from '@/components/BentoGrid/debugSeed';
import type {
  CardData,
  CardPosition,
  ProjectCardData,
  ThemeConfig,
} from '@/components/BentoGrid';

const BentoGrid = dynamic(
  () => import('@/components/BentoGrid').then((mod) => mod.BentoGrid),
  { ssr: false }
);

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
    return shouldUseBentoGridSeed(searchParams) ? createSeedProjectCards(cards) : cards;
  }, [searchParams]);

  const handleCardSelect = useCallback(
    (card: CardData) => {
      if (card.type === 'project') {
        if (card.id.startsWith('seed-project-')) return;
        router.push(`/?project=${card.id}`);
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
      onCardSelect={handleCardSelect}
      onBack={handleBack}
      breadcrumb="bentOS / projects"
      renderCard={renderProjectCard}
    />
  );
}

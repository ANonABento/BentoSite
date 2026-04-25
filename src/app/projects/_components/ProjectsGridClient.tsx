'use client';

import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { PROJECTS } from '@/lib/projects-data';
import type {
  CardData,
  CardPosition,
  ProjectCardData,
  ThemeConfig,
} from '@/components/UnifiedGrid';
import { ProjectCard } from '@/components/UnifiedGrid/cards';

const UnifiedGrid = dynamic(
  () => import('@/components/UnifiedGrid').then((mod) => mod.UnifiedGrid),
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
  onClick?: () => void
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
    />
  );
}

export function ProjectsGridClient() {
  const router = useRouter();
  const projectCards = useMemo(() => PROJECTS.map(mapProjectToCardData), []);

  const handleCardSelect = useCallback(
    (card: CardData) => {
      if (card.type === 'project') {
        router.push(`/?project=${card.id}`);
      }
    },
    [router]
  );

  const handleBack = useCallback(() => {
    router.push('/');
  }, [router]);

  return (
    <UnifiedGrid
      theme="premium"
      cards={projectCards}
      onCardSelect={handleCardSelect}
      onBack={handleBack}
      breadcrumb="bentOS / projects"
      renderCard={renderProjectCard}
    />
  );
}

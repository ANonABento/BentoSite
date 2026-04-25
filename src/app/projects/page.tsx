'use client';

/**
 * /projects - Projects showcase page
 *
 * Uses UnifiedGrid with premium theme to display portfolio projects
 * in an infinite scrollable/pannable grid.
 */

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { PROJECTS } from '@/lib/projects-data';
import type { ProjectCardData, CardData, CardPosition, ThemeConfig } from '@/components/UnifiedGrid';
import { ProjectCard } from '@/components/UnifiedGrid/cards';

// Dynamic import to avoid SSR issues
const UnifiedGrid = dynamic(
  () => import('@/components/UnifiedGrid').then((mod) => mod.UnifiedGrid),
  { ssr: false }
);

/**
 * Convert Project to ProjectCardData
 */
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

/**
 * Custom card renderer for projects
 */
function renderProjectCard(
  card: CardData,
  position: CardPosition,
  theme: ThemeConfig,
  isFocused?: boolean,
  onClick?: () => void,
): React.ReactNode {
  if (card.type !== 'project') return null;

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

export default function ProjectsPage() {
  const router = useRouter();

  // Convert projects to card data
  const projectCards = useMemo(
    () => PROJECTS.map(mapProjectToCardData),
    []
  );

  // Handle card selection - navigate to dashboard with project loaded in Viewfinder
  const handleCardSelect = useCallback(
    (card: CardData) => {
      if (card.type === 'project') {
        // Navigate to dashboard with project query param to open in Viewfinder
        router.push(`/?project=${card.id}`);
      }
    },
    [router]
  );

  // Handle back navigation
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

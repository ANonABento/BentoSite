'use client';

import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { PROJECTS } from '@/lib/projects-data';
import type { ProjectCaseStudyPathMap } from '@/lib/project-case-studies';
import { ProjectCard } from '@/components/BentoGrid/cards';
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

function mapProjectToCardData(
  project: typeof PROJECTS[number],
  caseStudyPathsByProjectId: ProjectCaseStudyPathMap
): ProjectCardData {
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
      caseStudy: caseStudyPathsByProjectId[project.id],
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

interface ProjectsGridClientProps {
  caseStudyPathsByProjectId: ProjectCaseStudyPathMap;
}

export function ProjectsGridClient({
  caseStudyPathsByProjectId,
}: ProjectsGridClientProps) {
  const router = useRouter();
  const projectCards = useMemo(
    () => PROJECTS.map((project) => mapProjectToCardData(project, caseStudyPathsByProjectId)),
    [caseStudyPathsByProjectId]
  );

  const handleCardSelect = useCallback(
    (card: CardData) => {
      if (card.type === 'project') {
        router.push(card.links?.caseStudy ?? `/?project=${card.id}`);
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

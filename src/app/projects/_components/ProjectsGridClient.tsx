'use client';

import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { PROJECTS } from '@/lib/projects-data';
import { ProjectCard } from '@/components/BentoGrid/cards';
import type {
  CardData,
  CardPosition,
  ProjectCardData,
  ThemeConfig,
} from '@/components/BentoGrid';

const CASE_STUDY_SLUGS_BY_PROJECT_ID: Record<string, string> = {
  'robotic-arm-puppeteer': 'robotic-arm-puppeteer',
};

const BentoGrid = dynamic(
  () => import('@/components/BentoGrid').then((mod) => mod.BentoGrid),
  { ssr: false }
);

function mapProjectToCardData(project: typeof PROJECTS[number]): ProjectCardData {
  const caseStudySlug = CASE_STUDY_SLUGS_BY_PROJECT_ID[project.id];

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
      caseStudy: caseStudySlug ? `/projects/${caseStudySlug}` : undefined,
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
  const projectCards = useMemo(() => PROJECTS.map(mapProjectToCardData), []);

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

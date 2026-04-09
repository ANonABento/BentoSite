'use client';

import dynamic from 'next/dynamic';
import {
  AboutSectionSkeleton,
  ProjectsSectionSkeleton,
  SkillsSkeleton,
  TimelineSectionSkeleton,
} from '@/components/ui/Skeleton';
import { LazyPanelFallback } from '@/components/ui';

export const AboutSection = dynamic(
  () => import('@/components/About/AboutSection').then((mod) => mod.AboutSection),
  { loading: () => <AboutSectionSkeleton /> }
);

export const TimelineSection = dynamic(
  () => import('@/components/Timeline/TimelineSection').then((mod) => mod.TimelineSection),
  { loading: () => <TimelineSectionSkeleton /> }
);

export const FeaturedProjects = dynamic(
  () => import('@/components/Projects/FeaturedProjects').then((mod) => mod.FeaturedProjects),
  { loading: () => <ProjectsSectionSkeleton /> }
);

export const ThreeViewer = dynamic(() => import('@/components/Dimension'), {
  ssr: false,
  loading: () => (
    <LazyPanelFallback
      label="Loading 3D Viewer..."
      spinnerSize="lg"
      spinnerVariant="purple"
    />
  ),
});

export const Chatbot = dynamic(() => import('@/components/Chat'), {
  ssr: false,
  loading: () => (
    <LazyPanelFallback
      label="Initializing chat..."
      spinnerSize="sm"
      spinnerVariant="purple"
    />
  ),
});

export const ProjectsModal = dynamic(
  () => import('@/components/Projects/ProjectsModal').then((mod) => mod.ProjectsModal),
  { ssr: false }
);

export const SkillsSection = dynamic(
  () => import('@/components/Skills/SkillsSection'),
  { ssr: false, loading: () => <SkillsSkeleton /> }
);

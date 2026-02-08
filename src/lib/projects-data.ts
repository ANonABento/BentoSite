// Projects Data - Kevin Jiang's portfolio projects
// Used by ProjectsModal for the portfolio showcase

import portfolioContent from '@/content/portfolio.json';
import type { ProjectMedia } from '@/components/MediaViewer/MediaViewer.types';

export type ProjectCategory =
  | 'Robotics'
  | 'AI & Robotics'
  | 'Hardware'
  | 'Software'
  | 'VR/AR'
  | 'Competition'
  | 'Accessibility'
  | 'Games';
export type ProjectStatus = 'Completed' | 'In Progress' | 'Archived';

export interface Project {
  id: string;
  name: string;
  shortDescription: string;
  description?: string;
  category: ProjectCategory;
  status: ProjectStatus;
  technologies: string[];
  thumbnail?: string;
  links: {
    liveDemo?: string;
    github?: string;
    modelPath?: string;
    docs?: string;
  };
  media?: ProjectMedia;
  featured?: boolean;
  dateCompleted?: string;
}

const content = portfolioContent as { projects: Project[] };

export const PROJECTS: Project[] = content.projects;

// Helper functions
export function getProjectsByCategory(category: ProjectCategory | 'All'): Project[] {
  if (category === 'All') return PROJECTS;
  return PROJECTS.filter((p) => p.category === category);
}

export function getFeaturedProjects(): Project[] {
  return PROJECTS.filter((p) => p.featured);
}

export function getProjectById(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}

export function getAllCategories(): (ProjectCategory | 'All')[] {
  const categories = new Set(PROJECTS.map((p) => p.category));
  return ['All', ...Array.from(categories)] as (ProjectCategory | 'All')[];
}

export function searchProjects(query: string, category: ProjectCategory | 'All'): Project[] {
  const lowerQuery = query.toLowerCase();
  return getProjectsByCategory(category).filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.shortDescription.toLowerCase().includes(lowerQuery) ||
      p.technologies.some((t) => t.toLowerCase().includes(lowerQuery))
  );
}

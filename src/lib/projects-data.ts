// Projects Data - Kevin Jiang's portfolio projects
// Used by ProjectsModal for the portfolio showcase
//
// Source: src/content/projects/<id>.json files, compiled into
// src/content/projects.generated.json by `npm run sync:projects`.
// Do not edit projects.generated.json by hand.

import projectsContent from '@/content/projects.generated.json';

export type ProjectCategory = string;
export type ProjectStatus = 'Completed' | 'In Progress' | 'Archived';

export interface ProjectMedia {
  featuredImage?: string;
  images?: string[];
  pdf?: string;
  video?: string;
  website?: string;
  game?: {
    type: 'unity-webgl' | 'itch';
    url: string;
  };
  map?: {
    locations: string[];
    highlightedIds?: string[];
  };
}

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

const content = projectsContent as { projects: Project[] };

export const PROJECTS: Project[] = content.projects;

export type ProjectMediaType = '3D' | 'Images' | 'PDF' | 'Website' | 'Video' | 'Game';

// Helper functions
export function getProjectsByCategory(category: ProjectCategory | 'All'): Project[] {
  if (category === 'All') return PROJECTS;
  return PROJECTS.filter((p) => p.category === category);
}

export function getFeaturedProjects(): Project[] {
  return PROJECTS
    .filter((p) => p.featured)
    .sort((left, right) => getProjectTimestamp(right) - getProjectTimestamp(left));
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

export function getProjectThumbnail(project: Project): string | undefined {
  if (project.media?.featuredImage) return project.media.featuredImage;
  if (project.media?.images?.[0]) return project.media.images[0];
  return project.thumbnail;
}

export function getProjectMediaTypes(project: Project): ProjectMediaType[] {
  const mediaTypes: ProjectMediaType[] = [];

  if (project.links.modelPath) mediaTypes.push('3D');
  if (project.media?.images?.length) mediaTypes.push('Images');
  if (project.media?.pdf) mediaTypes.push('PDF');
  if (project.media?.website) mediaTypes.push('Website');
  if (project.media?.video) mediaTypes.push('Video');
  if (project.media?.game) mediaTypes.push('Game');

  return mediaTypes;
}

export function hasProjectViewerMedia(project: Project): boolean {
  return getProjectMediaTypes(project).length > 0;
}

export function formatProjectDate(dateCompleted?: string): string | null {
  if (!dateCompleted) return null;

  const [yearString, monthString] = dateCompleted.split('-');
  const year = Number(yearString);
  const month = monthString ? Number(monthString) : null;

  if (!Number.isFinite(year)) return null;
  if (!month || !Number.isFinite(month)) return `${year}`;

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function getProjectTimelineLabel(project: Project): string {
  return formatProjectDate(project.dateCompleted) ?? project.status;
}

export function getProjectExternalLinkCount(project: Project): number {
  return [project.links.github, project.links.liveDemo, project.links.docs].filter(Boolean).length;
}

function getProjectTimestamp(project: Project): number {
  if (!project.dateCompleted) return 0;

  const [yearString, monthString = '1'] = project.dateCompleted.split('-');
  const year = Number(yearString);
  const month = Number(monthString);

  if (!Number.isFinite(year) || !Number.isFinite(month)) return 0;
  return Date.UTC(year, month - 1, 1);
}

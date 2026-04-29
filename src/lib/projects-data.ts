// Projects Data - Kevin Jiang's portfolio projects
// Used by ProjectsModal for the portfolio showcase

import portfolioContent from '@/content/portfolio.json';

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

export interface ProjectMedia {
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

const content = portfolioContent as { projects: Project[] };

// Generate test projects for physics testing
function generateTestProjects(count: number): Project[] {
  const categories: ProjectCategory[] = ['Robotics', 'Software', 'Hardware', 'AI & Robotics', 'Games', 'VR/AR'];
  const statuses: ProjectStatus[] = ['Completed', 'In Progress', 'Archived'];
  const techStacks = [
    ['React', 'TypeScript', 'Next.js'],
    ['Python', 'TensorFlow', 'OpenCV'],
    ['Rust', 'WebAssembly', 'Three.js'],
    ['C++', 'ROS', 'Arduino'],
    ['Swift', 'Metal', 'CoreML'],
    ['Go', 'Docker', 'Kubernetes'],
  ];
  const adjectives = ['Quantum', 'Neural', 'Cyber', 'Nano', 'Hyper', 'Meta', 'Ultra', 'Mega', 'Turbo', 'Fusion'];
  const nouns = ['Bot', 'Engine', 'System', 'Core', 'Hub', 'Net', 'Lab', 'Forge', 'Studio', 'Works'];

  return Array.from({ length: count }, (_, i) => ({
    id: `test-project-${i + 1}`,
    name: `${adjectives[i % adjectives.length]} ${nouns[i % nouns.length]} ${i + 1}`,
    shortDescription: `A cutting-edge ${categories[i % categories.length].toLowerCase()} project exploring innovative solutions.`,
    category: categories[i % categories.length],
    status: statuses[i % statuses.length],
    technologies: techStacks[i % techStacks.length],
    featured: i % 7 === 0, // Every 7th project is featured
    links: {},
  }));
}

// Set to true locally to add test projects for physics/grid testing.
// Must remain false in committed code — these are fake fixture projects
// ("Quantum Bot", "Neural Engine", etc.) that would otherwise ship to prod.
const ENABLE_TEST_PROJECTS = false;
const TEST_PROJECT_COUNT = 12;

export const PROJECTS: Project[] = ENABLE_TEST_PROJECTS
  ? [...content.projects, ...generateTestProjects(TEST_PROJECT_COUNT)]
  : content.projects;

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
  return project.thumbnail ?? project.media?.images?.[0];
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

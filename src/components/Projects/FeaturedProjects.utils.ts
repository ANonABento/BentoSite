import type { Project } from '@/lib/projects-data';

type ProjectTechnologySource = Pick<Project, 'technologies'>;

export function getFeaturedTechnologyFilters(projects: ProjectTechnologySource[]): string[] {
  return Array.from(new Set(projects.flatMap((project) => project.technologies))).sort((left, right) =>
    left.localeCompare(right)
  );
}

export function filterProjectsByTechnology<T extends ProjectTechnologySource>(
  projects: T[],
  technology: string | null
): T[] {
  if (!technology) return projects;
  return projects.filter((project) => project.technologies.includes(technology));
}

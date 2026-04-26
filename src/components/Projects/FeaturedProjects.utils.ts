import type { Project } from '@/lib/projects-data';

type ProjectTechnologySource = Pick<Project, 'technologies'>;

export interface TechnologyFilterOption {
  technology: string;
  count: number;
}

export function getFeaturedTechnologyFilterOptions(
  projects: ProjectTechnologySource[]
): TechnologyFilterOption[] {
  const counts = new Map<string, number>();

  for (const project of projects) {
    for (const technology of project.technologies) {
      counts.set(technology, (counts.get(technology) ?? 0) + 1);
    }
  }

  return Array.from(counts, ([technology, count]) => ({ technology, count })).sort((left, right) =>
    left.technology.localeCompare(right.technology)
  );
}

export function getFeaturedTechnologyFilters(projects: ProjectTechnologySource[]): string[] {
  return getFeaturedTechnologyFilterOptions(projects).map((option) => option.technology);
}

export function filterProjectsByTechnology<T extends ProjectTechnologySource>(
  projects: T[],
  technology: string | null
): T[] {
  if (!technology) return projects;
  return projects.filter((project) => project.technologies.includes(technology));
}

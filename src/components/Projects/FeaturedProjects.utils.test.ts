import { describe, expect, it } from 'vitest';
import {
  filterProjectsByTechnology,
  getFeaturedTechnologyFilterOptions,
  getFeaturedTechnologyFilters,
} from './FeaturedProjects.utils';
import type { Project } from '@/lib/projects-data';

const projects = [
  {
    id: 'robot-arm',
    technologies: ['Python', 'ROS2', 'Three.js'],
  },
  {
    id: 'robot-head',
    technologies: ['Python', 'OpenCV', 'PyTorch'],
  },
  {
    id: 'ar-robot',
    technologies: ['Unity', 'C#', 'ROS2'],
  },
] satisfies Pick<Project, 'id' | 'technologies'>[];

describe('FeaturedProjects filtering', () => {
  it('returns every available technology tag without truncating the filter list', () => {
    expect(getFeaturedTechnologyFilters(projects)).toEqual([
      'C#',
      'OpenCV',
      'Python',
      'PyTorch',
      'ROS2',
      'Three.js',
      'Unity',
    ]);
  });

  it('returns technology filters with matching featured project counts', () => {
    expect(getFeaturedTechnologyFilterOptions(projects)).toEqual([
      { technology: 'C#', count: 1 },
      { technology: 'OpenCV', count: 1 },
      { technology: 'Python', count: 2 },
      { technology: 'PyTorch', count: 1 },
      { technology: 'ROS2', count: 2 },
      { technology: 'Three.js', count: 1 },
      { technology: 'Unity', count: 1 },
    ]);
  });

  it('keeps all projects visible when no technology is selected', () => {
    expect(filterProjectsByTechnology(projects, null)).toEqual(projects);
  });

  it('filters by exact technology tag', () => {
    expect(filterProjectsByTechnology(projects, 'ROS2').map((project) => project.id)).toEqual([
      'robot-arm',
      'ar-robot',
    ]);
  });
});

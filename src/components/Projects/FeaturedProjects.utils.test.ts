import { describe, expect, it } from 'vitest';
import {
  filterProjectsByTechnology,
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

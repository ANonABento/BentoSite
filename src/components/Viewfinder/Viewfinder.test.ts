import { describe, expect, it } from 'vitest';
import {
  getAvailableViewfinderTabs,
  getViewfinderImages,
} from './Viewfinder';
import type { Project } from '@/lib/projects-data';

function makeProject(overrides: Partial<Project>): Project {
  return {
    id: 'test-project',
    name: 'Test Project',
    shortDescription: 'A test project',
    category: 'Software',
    status: 'Completed',
    technologies: [],
    links: {},
    ...overrides,
  };
}

describe('Viewfinder media resolution', () => {
  it('uses the default 3D viewer and map when no project is selected', () => {
    expect(getAvailableViewfinderTabs(null)).toEqual(['3d', 'map']);
    expect(getViewfinderImages(null)).toEqual([]);
  });

  it('exposes a gallery tab when a project only has a featured image', () => {
    const project = makeProject({
      media: {
        featuredImage: '/projects/example/hero.png',
      },
    });

    expect(getViewfinderImages(project)).toEqual(['/projects/example/hero.png']);
    expect(getAvailableViewfinderTabs(project)).toEqual(['images', 'map']);
  });

  it('deduplicates featured image and gallery images without changing order', () => {
    const project = makeProject({
      media: {
        featuredImage: '/projects/example/hero.png',
        images: [
          '/projects/example/hero.png',
          '/projects/example/detail.png',
        ],
      },
    });

    expect(getViewfinderImages(project)).toEqual([
      '/projects/example/hero.png',
      '/projects/example/detail.png',
    ]);
  });

  it('adds project-specific tabs for every available media type', () => {
    const project = makeProject({
      links: {
        modelPath: '/models/example.glb',
      },
      media: {
        featuredImage: '/projects/example/hero.png',
        pdf: '/projects/example/spec.pdf',
        website: 'https://example.com',
        video: '/projects/example/demo.mp4',
        game: {
          type: 'itch',
          url: 'https://example.itch.io/game',
        },
      },
    });

    expect(getAvailableViewfinderTabs(project)).toEqual([
      '3d',
      'images',
      'pdf',
      'website',
      'video',
      'game',
      'map',
    ]);
  });
});

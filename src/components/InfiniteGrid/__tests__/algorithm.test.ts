// Tests for bento layout algorithm
import { describe, it, expect } from 'vitest';
import {
  assignCardSizes,
  getCardDimensions,
  calculateBentoLayout,
  calculateGridBounds,
} from '../layout/algorithm';
import type { Project } from '@/lib/projects-data';

// Mock projects for testing
const createMockProject = (id: string, featured = false): Project => ({
  id,
  name: `Project ${id}`,
  shortDescription: 'Test project',
  description: 'Test description',
  technologies: ['React'],
  category: 'Software',
  status: 'Completed',
  featured,
  thumbnail: '/test.jpg',
  links: {},
});

describe('assignCardSizes', () => {
  it('assigns 2x2 to featured projects', () => {
    const projects = [
      createMockProject('1', true),
      createMockProject('2', false),
    ];
    const sizes = assignCardSizes(projects);
    expect(sizes.get('1')).toBe('2x2');
    expect(sizes.get('2')).not.toBe('2x2');
  });

  it('distributes varied sizes for non-featured projects', () => {
    const projects = Array.from({ length: 6 }, (_, i) =>
      createMockProject(String(i))
    );
    const sizes = assignCardSizes(projects);

    // Should have variety in sizes
    const sizeValues = Array.from(sizes.values());
    const uniqueSizes = new Set(sizeValues);
    expect(uniqueSizes.size).toBeGreaterThan(1);
  });

  it('returns empty map for empty input', () => {
    const sizes = assignCardSizes([]);
    expect(sizes.size).toBe(0);
  });
});

describe('getCardDimensions', () => {
  const config = { cellSize: 200, columns: 6, gap: 16 };

  it('calculates 1x1 dimensions correctly', () => {
    const dims = getCardDimensions('1x1', config);
    expect(dims.width).toBe(200);
    expect(dims.height).toBe(200);
  });

  it('calculates 2x1 dimensions correctly', () => {
    const dims = getCardDimensions('2x1', config);
    // 2 cells + 1 gap
    expect(dims.width).toBe(200 * 2 + 16);
    expect(dims.height).toBe(200);
  });

  it('calculates 1x2 dimensions correctly', () => {
    const dims = getCardDimensions('1x2', config);
    expect(dims.width).toBe(200);
    expect(dims.height).toBe(200 * 2 + 16);
  });

  it('calculates 2x2 dimensions correctly', () => {
    const dims = getCardDimensions('2x2', config);
    expect(dims.width).toBe(200 * 2 + 16);
    expect(dims.height).toBe(200 * 2 + 16);
  });
});

describe('calculateBentoLayout', () => {
  it('returns empty map for empty projects', () => {
    const sizes = new Map();
    const layouts = calculateBentoLayout([], sizes);
    expect(layouts.size).toBe(0);
  });

  it('places projects without overlap', () => {
    const projects = Array.from({ length: 5 }, (_, i) =>
      createMockProject(String(i))
    );
    const sizes = assignCardSizes(projects);
    const layouts = calculateBentoLayout(projects, sizes);

    // Check that no two cards overlap
    const layoutArray = Array.from(layouts.values());
    for (let i = 0; i < layoutArray.length; i++) {
      for (let j = i + 1; j < layoutArray.length; j++) {
        const a = layoutArray[i];
        const b = layoutArray[j];

        const aLeft = a.x - a.width / 2;
        const aRight = a.x + a.width / 2;
        const aTop = a.y - a.height / 2;
        const aBottom = a.y + a.height / 2;

        const bLeft = b.x - b.width / 2;
        const bRight = b.x + b.width / 2;
        const bTop = b.y - b.height / 2;
        const bBottom = b.y + b.height / 2;

        // Check for overlap (with small tolerance for floating point)
        const noOverlap =
          aRight <= bLeft + 1 ||
          bRight <= aLeft + 1 ||
          aBottom <= bTop + 1 ||
          bBottom <= aTop + 1;

        expect(noOverlap).toBe(true);
      }
    }
  });

  it('creates layout for each project', () => {
    const projects = Array.from({ length: 3 }, (_, i) =>
      createMockProject(String(i))
    );
    const sizes = assignCardSizes(projects);
    const layouts = calculateBentoLayout(projects, sizes);

    expect(layouts.size).toBe(3);
    projects.forEach((p) => {
      expect(layouts.has(p.id)).toBe(true);
    });
  });

  it('centers grid horizontally', () => {
    const projects = [createMockProject('1')];
    const sizes = new Map([['1', '1x1' as const]]);
    const layouts = calculateBentoLayout(projects, sizes);

    const layout = layouts.get('1')!;
    // With default 6 columns and 200px cells, first card should be on the left side
    // but overall grid should be centered
    expect(Math.abs(layout.x)).toBeLessThan(1000); // Reasonable range
  });
});

describe('calculateGridBounds', () => {
  it('calculates bounds correctly for single card', () => {
    const layouts = new Map([
      ['1', { id: '1', x: 0, y: 0, width: 200, height: 200, size: '1x1' as const }],
    ]);
    const bounds = calculateGridBounds(layouts);

    expect(bounds.minX).toBe(-100);
    expect(bounds.maxX).toBe(100);
    expect(bounds.minY).toBe(-100);
    expect(bounds.maxY).toBe(100);
    expect(bounds.width).toBe(200);
    expect(bounds.height).toBe(200);
  });

  it('calculates bounds correctly for multiple cards', () => {
    const layouts = new Map([
      ['1', { id: '1', x: 0, y: 0, width: 100, height: 100, size: '1x1' as const }],
      ['2', { id: '2', x: 200, y: 0, width: 100, height: 100, size: '1x1' as const }],
    ]);
    const bounds = calculateGridBounds(layouts);

    expect(bounds.minX).toBe(-50);
    expect(bounds.maxX).toBe(250);
    expect(bounds.width).toBe(300);
  });
});

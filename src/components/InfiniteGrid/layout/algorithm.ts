// Bento Grid Layout Algorithm
// Radial packing algorithm - cards arranged around a central search card
// Supports exclusion zones for clamped search card

import type { Project } from '@/lib/projects-data';
import type { CardLayout, CardSize, GridConfig, ExclusionZone } from '../InfiniteGrid.types';
import { GRID, CARD_SIZES } from '../InfiniteGrid.constants';

/**
 * Assign card sizes based on project properties
 * Featured projects get 2x2, others get varied sizes for visual interest
 */
export function assignCardSizes(projects: Project[]): Map<string, CardSize> {
  const sizes = new Map<string, CardSize>();
  const availableSizes: CardSize[] = ['1x1', '2x1', '1x2'];

  // Pattern for non-featured cards for visual variety
  const sizePattern = [0, 1, 0, 2, 0, 0]; // indices into availableSizes

  let patternIndex = 0;

  for (const project of projects) {
    if (project.featured) {
      sizes.set(project.id, '2x2');
    } else {
      const sizeIndex = sizePattern[patternIndex % sizePattern.length];
      sizes.set(project.id, availableSizes[sizeIndex]);
      patternIndex++;
    }
  }

  return sizes;
}

/**
 * Calculate pixel dimensions for a given card size
 */
export function getCardDimensions(
  size: CardSize,
  config: GridConfig = GRID
): { width: number; height: number } {
  const { cols, rows } = CARD_SIZES[size];
  return {
    width: cols * config.cellSize + (cols - 1) * config.gap,
    height: rows * config.cellSize + (rows - 1) * config.gap,
  };
}

/**
 * Generate cell positions ordered by distance from center
 * Returns array of {col, row} with (0,0) being center
 */
function generateRadialCellOrder(radius: number): Array<{ col: number; row: number }> {
  const cells: Array<{ col: number; row: number; dist: number }> = [];

  for (let row = -radius; row <= radius; row++) {
    for (let col = -radius; col <= radius; col++) {
      // Distance from center (using max for "square" distance which looks better for grid)
      const dist = Math.max(Math.abs(row), Math.abs(col));
      cells.push({ col, row, dist });
    }
  }

  // Sort by distance from center, then by row, then by col for deterministic order
  cells.sort((a, b) => {
    if (a.dist !== b.dist) return a.dist - b.dist;
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });

  return cells.map(({ col, row }) => ({ col, row }));
}

/**
 * Convert grid cell to pixel position (center of card)
 * Grid is centered at origin (0, 0) - cell (0,0) has center at (0,0)
 */
function cellToPixel(
  col: number,
  row: number,
  cardWidth: number,
  cardHeight: number,
  config: GridConfig
): { x: number; y: number } {
  const cellStep = config.cellSize + config.gap;

  // Center of cell (col, row) is at (col * cellStep, row * cellStep)
  // This ensures cell (0,0) is centered at origin
  // For multi-cell cards, offset by half the extra width/height
  const extraWidth = cardWidth - config.cellSize;
  const extraHeight = cardHeight - config.cellSize;

  const x = col * cellStep + extraWidth / 2;
  const y = row * cellStep + extraHeight / 2;

  return { x, y };
}

/**
 * Check if two rectangles overlap (with padding)
 */
function rectanglesOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
  padding = 0
): boolean {
  const aLeft = ax - aw / 2 - padding;
  const aRight = ax + aw / 2 + padding;
  const aTop = ay - ah / 2 - padding;
  const aBottom = ay + ah / 2 + padding;

  const bLeft = bx - bw / 2;
  const bRight = bx + bw / 2;
  const bTop = by - bh / 2;
  const bBottom = by + bh / 2;

  return !(aRight < bLeft || aLeft > bRight || aBottom < bTop || aTop > bBottom);
}

/**
 * Calculate bento grid layout for projects
 * Uses radial placement - cards arranged around center
 * SearchCard is at center, projects radiate outward
 */
export function calculateBentoLayout(
  projects: Project[],
  sizes: Map<string, CardSize>,
  config: GridConfig = GRID
): Map<string, CardLayout> {
  const layouts = new Map<string, CardLayout>();

  if (projects.length === 0) return layouts;

  // Grid radius - how far from center we need
  // Estimate based on number of projects
  const gridRadius = Math.ceil(Math.sqrt(projects.length)) + 2;

  // Track occupied cells using a Map with "col,row" keys
  // This allows negative indices
  const occupied = new Map<string, boolean>();

  const cellKey = (col: number, row: number) => `${col},${row}`;

  const isOccupied = (col: number, row: number) => occupied.get(cellKey(col, row)) ?? false;

  const markOccupied = (col: number, row: number) => occupied.set(cellKey(col, row), true);

  // Add search card to layout (2x1 at center)
  // Search card is 2 cells wide (2*200 + 16 gap = 416px)
  // Placed at cells 0 and 1 horizontally, row 0
  markOccupied(0, 0);
  markOccupied(1, 0);

  // Calculate search card position and add to layouts
  const searchWidth = 2 * config.cellSize + config.gap; // 416px
  const searchHeight = config.cellSize; // 200px
  const searchPos = cellToPixel(0, 0, searchWidth, searchHeight, config);
  layouts.set('__search__', {
    id: '__search__',
    x: searchPos.x,
    y: searchPos.y,
    width: searchWidth,
    height: searchHeight,
    size: '2x1',
  });

  // Generate cell positions in radial order (closest to center first)
  const cellOrder = generateRadialCellOrder(gridRadius);

  // Place each project
  for (const project of projects) {
    const size = sizes.get(project.id) || '1x1';
    const { cols: colSpan, rows: rowSpan } = CARD_SIZES[size];
    const { width, height } = getCardDimensions(size, config);

    let placed = false;

    // Try each position in radial order
    for (const { col, row } of cellOrder) {
      if (placed) break;

      // Check if all required cells are free
      let canPlace = true;
      for (let r = 0; r < rowSpan && canPlace; r++) {
        for (let c = 0; c < colSpan && canPlace; c++) {
          if (isOccupied(col + c, row + r)) {
            canPlace = false;
          }
        }
      }

      if (canPlace) {
        // Mark cells as occupied
        for (let r = 0; r < rowSpan; r++) {
          for (let c = 0; c < colSpan; c++) {
            markOccupied(col + c, row + r);
          }
        }

        // Calculate pixel position
        const { x, y } = cellToPixel(col, row, width, height, config);

        layouts.set(project.id, {
          id: project.id,
          x,
          y,
          width,
          height,
          size,
        });

        placed = true;
      }
    }

    // Fallback - shouldn't happen with sufficient radius
    if (!placed) {
      console.warn(`Could not place project ${project.id}`);
      layouts.set(project.id, {
        id: project.id,
        x: 0,
        y: (gridRadius + 1) * (config.cellSize + config.gap),
        width,
        height,
        size,
      });
    }
  }

  return layouts;
}

/**
 * Calculate bento layout with an exclusion zone (for clamped search card)
 * Cards are placed to avoid overlapping the exclusion zone
 */
export function calculateBentoLayoutWithExclusion(
  projects: Project[],
  sizes: Map<string, CardSize>,
  exclusionZone: ExclusionZone,
  config: GridConfig = GRID
): Map<string, CardLayout> {
  const layouts = new Map<string, CardLayout>();

  if (projects.length === 0) return layouts;

  const gridRadius = Math.ceil(Math.sqrt(projects.length)) + 3;
  const occupied = new Map<string, boolean>();
  const cellKey = (col: number, row: number) => `${col},${row}`;
  const isOccupied = (col: number, row: number) => occupied.get(cellKey(col, row)) ?? false;
  const markOccupied = (col: number, row: number) => occupied.set(cellKey(col, row), true);

  // DO NOT reserve center cells when search card is clamped
  // The exclusion zone (clamped position) will be checked directly

  const cellOrder = generateRadialCellOrder(gridRadius);
  const exclusionPadding = 24; // Extra buffer around exclusion zone

  for (const project of projects) {
    const size = sizes.get(project.id) || '1x1';
    const { cols: colSpan, rows: rowSpan } = CARD_SIZES[size];
    const { width, height } = getCardDimensions(size, config);

    let placed = false;

    for (const { col, row } of cellOrder) {
      if (placed) break;

      // Check if all required cells are free
      let canPlace = true;
      for (let r = 0; r < rowSpan && canPlace; r++) {
        for (let c = 0; c < colSpan && canPlace; c++) {
          if (isOccupied(col + c, row + r)) {
            canPlace = false;
          }
        }
      }

      if (!canPlace) continue;

      // Calculate pixel position for this placement
      const { x, y } = cellToPixel(col, row, width, height, config);

      // Check if this position overlaps with the exclusion zone
      if (rectanglesOverlap(
        x, y, width, height,
        exclusionZone.x, exclusionZone.y, exclusionZone.width, exclusionZone.height,
        exclusionPadding
      )) {
        // Would overlap with clamped search card, skip this position
        continue;
      }

      // Mark cells as occupied
      for (let r = 0; r < rowSpan; r++) {
        for (let c = 0; c < colSpan; c++) {
          markOccupied(col + c, row + r);
        }
      }

      layouts.set(project.id, {
        id: project.id,
        x,
        y,
        width,
        height,
        size,
      });

      placed = true;
    }

    // Fallback
    if (!placed) {
      const { width, height } = getCardDimensions(size, config);
      layouts.set(project.id, {
        id: project.id,
        x: 0,
        y: (gridRadius + 1) * (config.cellSize + config.gap),
        width,
        height,
        size,
      });
    }
  }

  return layouts;
}

/**
 * Get search card layout - positioned at exact center of the grid
 * Center at (0, 0) - the visual center of the infinite canvas
 */
export function getSearchCardLayout(
  width: number,
  height: number
): CardLayout {
  // Search card centered exactly at origin
  // Cards will be placed around it in all directions
  return {
    id: '__search__',
    x: 0,
    y: 0,
    width,
    height,
    size: '2x1',
  };
}

/**
 * Calculate total bounds of all cards
 */
export function calculateGridBounds(layouts: Map<string, CardLayout>): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
} {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const layout of layouts.values()) {
    const left = layout.x - layout.width / 2;
    const right = layout.x + layout.width / 2;
    const top = layout.y - layout.height / 2;
    const bottom = layout.y + layout.height / 2;

    minX = Math.min(minX, left);
    maxX = Math.max(maxX, right);
    minY = Math.min(minY, top);
    maxY = Math.max(maxY, bottom);
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

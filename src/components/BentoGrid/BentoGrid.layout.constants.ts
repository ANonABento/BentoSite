import type {
  CardSize,
  GridLayoutConfig,
} from './BentoGrid.types';

const GRID_CELL_SIZE = 180;
const GRID_GAP = 12;
const GRID_SPAWN_BUFFER = 100;
const GRID_DESPAWN_BUFFER = 200;

export const GRID: GridLayoutConfig & {
  /** Buffer zone around viewport for spawning (pixels). */
  spawnBuffer: number;
  /** Buffer zone for despawning (pixels beyond viewport). */
  despawnBuffer: number;
  /** @deprecated Use cellSize. */
  CELL_SIZE: number;
  /** @deprecated Use gap. */
  GAP: number;
  /** @deprecated Use spawnBuffer. */
  SPAWN_BUFFER: number;
  /** @deprecated Use despawnBuffer. */
  DESPAWN_BUFFER: number;
} = {
  cellSize: GRID_CELL_SIZE,
  gap: GRID_GAP,
  spawnBuffer: GRID_SPAWN_BUFFER,
  despawnBuffer: GRID_DESPAWN_BUFFER,
  CELL_SIZE: GRID_CELL_SIZE,
  GAP: GRID_GAP,
  SPAWN_BUFFER: GRID_SPAWN_BUFFER,
  DESPAWN_BUFFER: GRID_DESPAWN_BUFFER,
};

export const CARD_SIZES: Record<CardSize, { cols: number; rows: number }> = {
  '1x1': { cols: 1, rows: 1 },
  '2x1': { cols: 2, rows: 1 },
  '1x2': { cols: 1, rows: 2 },
  '2x2': { cols: 2, rows: 2 },
};

/** Calculate pixel dimensions for a card size. */
export function getCardDimensions(size: CardSize): { width: number; height: number } {
  const { cols, rows } = CARD_SIZES[size];

  return {
    width: cols * GRID.cellSize + (cols - 1) * GRID.gap,
    height: rows * GRID.cellSize + (rows - 1) * GRID.gap,
  };
}

/**
 * Grid Occupancy Map — tracks which grid cells are occupied by which cards.
 *
 * Grid coordinates:
 *   - (col, row) integers, origin at (0, 0)
 *   - Pixel position: x = col * step, y = row * step
 *   - Step = CELL_SIZE + GAP (192px default)
 *   - Multi-cell cards (2x1, 1x2, 2x2) occupy contiguous cells
 *
 * The map is a simple string→string dictionary: "col,row" → cardId.
 * This allows O(1) lookups and works with an infinite canvas (no bounds).
 */

import type { CardSize } from '../BentoGrid.types';
import { CARD_SIZES, GRID } from '../BentoGrid.constants';

/** Pixel distance per grid step (cell + gap). */
export const GRID_STEP = GRID.CELL_SIZE + GRID.GAP;

/** Unique key for a grid cell. */
export function cellKey(col: number, row: number): string {
  return `${col},${row}`;
}

/** Convert a grid cell (col, row) to canvas pixel position (top-left). */
export function cellToPixel(col: number, row: number): { x: number; y: number } {
  return {
    x: col * GRID_STEP,
    y: row * GRID_STEP,
  };
}

/** Convert a canvas pixel position to the nearest grid cell. */
export function pixelToCell(x: number, y: number): { col: number; row: number } {
  return {
    col: Math.round(x / GRID_STEP),
    row: Math.round(y / GRID_STEP),
  };
}

/** Get the column and row span for a card size. */
export function sizeToSpan(size: CardSize): { cols: number; rows: number } {
  return CARD_SIZES[size];
}

/**
 * Mutable occupancy map. Tracks which cells are taken and by whom.
 */
export class GridOccupancy {
  /** "col,row" → cardId */
  private cells = new Map<string, string>();
  /** cardId → list of "col,row" keys it occupies */
  private cardCells = new Map<string, string[]>();

  /** Check if a card of the given size can be placed at (col, row). */
  canPlace(col: number, row: number, size: CardSize): boolean {
    const { cols, rows } = sizeToSpan(size);
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (this.cells.has(cellKey(col + c, row + r))) return false;
      }
    }
    return true;
  }

  /** Place a card at (col, row), marking all cells it occupies. */
  place(col: number, row: number, size: CardSize, cardId: string): void {
    const { cols, rows } = sizeToSpan(size);
    const keys: string[] = [];
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const key = cellKey(col + c, row + r);
        this.cells.set(key, cardId);
        keys.push(key);
      }
    }
    this.cardCells.set(cardId, keys);
  }

  /** Release all cells occupied by a card. */
  release(cardId: string): void {
    const keys = this.cardCells.get(cardId);
    if (!keys) return;
    for (const key of keys) {
      this.cells.delete(key);
    }
    this.cardCells.delete(cardId);
  }

  /** Check if a specific cell is occupied. */
  isOccupied(col: number, row: number): boolean {
    return this.cells.has(cellKey(col, row));
  }

  /** Get the card ID at a specific cell, or undefined. */
  getCardAt(col: number, row: number): string | undefined {
    return this.cells.get(cellKey(col, row));
  }

  /** Check if a card is placed in the grid. */
  hasCard(cardId: string): boolean {
    return this.cardCells.has(cardId);
  }

  /** Clear the entire grid. */
  clear(): void {
    this.cells.clear();
    this.cardCells.clear();
  }

  /**
   * Reserve a rectangular zone of cells under a single ID.
   * Used for the search card exclusion zone.
   */
  reserveZone(
    startCol: number,
    startRow: number,
    colSpan: number,
    rowSpan: number,
    reserveId: string,
  ): void {
    const keys: string[] = this.cardCells.get(reserveId) ?? [];
    for (let c = 0; c < colSpan; c++) {
      for (let r = 0; r < rowSpan; r++) {
        const key = cellKey(startCol + c, startRow + r);
        if (!this.cells.has(key)) {
          this.cells.set(key, reserveId);
          keys.push(key);
        }
      }
    }
    this.cardCells.set(reserveId, keys);
  }

  /** Number of cards placed. */
  get size(): number {
    return this.cardCells.size;
  }

  /**
   * Find the nearest available grid cell for a card of the given size,
   * searching outward from (centerCol, centerRow) in a BFS spiral.
   *
   * Returns null if no position found within maxRadius.
   */
  findNearest(
    centerCol: number,
    centerRow: number,
    size: CardSize,
    maxRadius = 20,
  ): { col: number; row: number } | null {
    // Check center first
    if (this.canPlace(centerCol, centerRow, size)) {
      return { col: centerCol, row: centerRow };
    }

    // BFS spiral outward
    for (let radius = 1; radius <= maxRadius; radius++) {
      // Walk the perimeter of the square at this radius
      for (let offset = -radius; offset <= radius; offset++) {
        // Top edge
        if (this.canPlace(centerCol + offset, centerRow - radius, size)) {
          return { col: centerCol + offset, row: centerRow - radius };
        }
        // Bottom edge
        if (this.canPlace(centerCol + offset, centerRow + radius, size)) {
          return { col: centerCol + offset, row: centerRow + radius };
        }
        // Left edge (skip corners, already checked)
        if (offset !== -radius && offset !== radius) {
          if (this.canPlace(centerCol - radius, centerRow + offset, size)) {
            return { col: centerCol - radius, row: centerRow + offset };
          }
          // Right edge
          if (this.canPlace(centerCol + radius, centerRow + offset, size)) {
            return { col: centerCol + radius, row: centerRow + offset };
          }
        }
      }
    }

    return null;
  }
}

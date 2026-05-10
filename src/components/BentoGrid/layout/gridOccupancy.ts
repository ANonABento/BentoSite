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
  /** Counter that rotates `findNearest` tie-breaking through quadrants
   *  so cards at equal distance fan out symmetrically (N → E → S → W → …)
   *  instead of always biasing toward top-left. */
  private placementCount = 0;

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
    this.placementCount = 0;
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
   * searching outward from (centerCol, centerRow).
   *
   * Each ring collects every valid candidate, scored by true center-to-center
   * Euclidean distance (each cell's center is at `col + 0.5, row + 0.5`).
   * Ties — frequent on the four cardinal/diagonal cells around the origin —
   * are broken by an angular sort whose origin rotates 90° per placement, so
   * cards fan out N → E → S → W → … instead of piling up in one quadrant.
   *
   * `opts.accept` lets the caller veto cells (e.g. cells that would overlap
   * the visible viewport) without giving up the radial search semantics.
   *
   * Returns null if no position found within maxRadius.
   */
  findNearest(
    centerCol: number,
    centerRow: number,
    size: CardSize,
    opts: {
      maxRadius?: number;
      accept?: (cell: { col: number; row: number }, size: CardSize) => boolean;
    } = {},
  ): { col: number; row: number } | null {
    const { maxRadius = 20, accept } = opts;

    if (this.canPlace(centerCol, centerRow, size) && (!accept || accept({ col: centerCol, row: centerRow }, size))) {
      this.placementCount++;
      return { col: centerCol, row: centerRow };
    }

    const { cols, rows } = sizeToSpan(size);
    // True continuous center of the search-anchor cell.
    const searchX = centerCol + 0.5;
    const searchY = centerRow + 0.5;

    for (let radius = 1; radius <= maxRadius; radius++) {
      const candidates: Array<{
        col: number;
        row: number;
        distSq: number;
        angle: number;
      }> = [];

      for (let offset = -radius; offset <= radius; offset++) {
        const cells = [
          { col: centerCol + offset, row: centerRow - radius }, // top edge
          { col: centerCol + offset, row: centerRow + radius }, // bottom edge
        ];
        if (offset !== -radius && offset !== radius) {
          cells.push(
            { col: centerCol - radius, row: centerRow + offset }, // left edge
            { col: centerCol + radius, row: centerRow + offset }, // right edge
          );
        }

        for (const cell of cells) {
          if (!this.canPlace(cell.col, cell.row, size)) continue;
          if (accept && !accept(cell, size)) continue;
          // True center of the card placed at this anchor.
          const cardCenterX = cell.col + cols / 2;
          const cardCenterY = cell.row + rows / 2;
          const dx = cardCenterX - searchX;
          const dy = cardCenterY - searchY;
          candidates.push({
            col: cell.col,
            row: cell.row,
            distSq: dx * dx + dy * dy,
            angle: Math.atan2(dy, dx),
          });
        }
      }

      if (candidates.length === 0) continue;

      // Pick min distance; among ties, rotate quadrants per placement so the
      // four cardinal/diagonal slots around the origin get filled evenly.
      candidates.sort((a, b) => a.distSq - b.distSq);
      const minDistSq = candidates[0].distSq;
      const tied = candidates.filter((c) => c.distSq - minDistSq < 1e-9);

      if (tied.length > 1) {
        const baseAngle = (this.placementCount * Math.PI) / 2;
        tied.sort((a, b) => {
          const angA = ((a.angle - baseAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
          const angB = ((b.angle - baseAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
          return angA - angB;
        });
      }

      this.placementCount++;
      return { col: tied[0].col, row: tied[0].row };
    }

    return null;
  }
}

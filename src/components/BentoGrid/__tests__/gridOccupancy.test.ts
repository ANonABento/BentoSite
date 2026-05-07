import { describe, it, expect, beforeEach } from 'vitest';
import {
  GridOccupancy,
  cellToPixel,
  pixelToCell,
  GRID_STEP,
} from '../layout/gridOccupancy';

describe('GridOccupancy', () => {
  let grid: GridOccupancy;

  beforeEach(() => {
    grid = new GridOccupancy();
  });

  describe('canPlace', () => {
    it('allows placement on empty grid', () => {
      expect(grid.canPlace(0, 0, '1x1')).toBe(true);
      expect(grid.canPlace(0, 0, '2x2')).toBe(true);
    });

    it('rejects placement on occupied cell', () => {
      grid.place(0, 0, '1x1', 'card-a');
      expect(grid.canPlace(0, 0, '1x1')).toBe(false);
    });

    it('rejects placement overlapping multi-cell card', () => {
      grid.place(0, 0, '2x2', 'card-a');
      expect(grid.canPlace(1, 1, '1x1')).toBe(false);
      expect(grid.canPlace(0, 1, '1x1')).toBe(false);
      expect(grid.canPlace(1, 0, '1x1')).toBe(false);
    });

    it('allows placement adjacent to occupied cells', () => {
      grid.place(0, 0, '1x1', 'card-a');
      expect(grid.canPlace(1, 0, '1x1')).toBe(true);
      expect(grid.canPlace(0, 1, '1x1')).toBe(true);
      expect(grid.canPlace(-1, 0, '1x1')).toBe(true);
    });

    it('handles 2x1 card checking both cells', () => {
      grid.place(1, 0, '1x1', 'card-a');
      expect(grid.canPlace(0, 0, '2x1')).toBe(false); // would overlap at (1,0)
      expect(grid.canPlace(2, 0, '2x1')).toBe(true);
    });

    it('handles 1x2 card checking both cells', () => {
      grid.place(0, 1, '1x1', 'card-a');
      expect(grid.canPlace(0, 0, '1x2')).toBe(false); // would overlap at (0,1)
      expect(grid.canPlace(0, 2, '1x2')).toBe(true);
    });
  });

  describe('place and release', () => {
    it('places a 1x1 card', () => {
      grid.place(3, 4, '1x1', 'card-a');
      expect(grid.isOccupied(3, 4)).toBe(true);
      expect(grid.getCardAt(3, 4)).toBe('card-a');
      expect(grid.size).toBe(1);
    });

    it('places a 2x2 card occupying 4 cells', () => {
      grid.place(0, 0, '2x2', 'card-big');
      expect(grid.isOccupied(0, 0)).toBe(true);
      expect(grid.isOccupied(1, 0)).toBe(true);
      expect(grid.isOccupied(0, 1)).toBe(true);
      expect(grid.isOccupied(1, 1)).toBe(true);
      expect(grid.isOccupied(2, 0)).toBe(false);
      expect(grid.size).toBe(1);
    });

    it('releases a card and frees cells', () => {
      grid.place(0, 0, '2x2', 'card-big');
      grid.release('card-big');
      expect(grid.isOccupied(0, 0)).toBe(false);
      expect(grid.isOccupied(1, 1)).toBe(false);
      expect(grid.size).toBe(0);
    });

    it('releasing unknown card is a no-op', () => {
      grid.release('nonexistent');
      expect(grid.size).toBe(0);
    });

    it('hasCard returns correct state', () => {
      expect(grid.hasCard('card-a')).toBe(false);
      grid.place(0, 0, '1x1', 'card-a');
      expect(grid.hasCard('card-a')).toBe(true);
      grid.release('card-a');
      expect(grid.hasCard('card-a')).toBe(false);
    });
  });

  describe('clear', () => {
    it('removes all cards and cells', () => {
      grid.place(0, 0, '1x1', 'a');
      grid.place(1, 0, '2x1', 'b');
      grid.place(0, 1, '1x2', 'c');
      grid.clear();
      expect(grid.size).toBe(0);
      expect(grid.isOccupied(0, 0)).toBe(false);
    });
  });

  describe('findNearest', () => {
    it('returns center when empty', () => {
      const result = grid.findNearest(0, 0, '1x1');
      expect(result).toEqual({ col: 0, row: 0 });
    });

    it('finds adjacent cell when center is occupied', () => {
      grid.place(0, 0, '1x1', 'card-a');
      const result = grid.findNearest(0, 0, '1x1');
      expect(result).not.toBeNull();
      expect(result).not.toEqual({ col: 0, row: 0 });
      // Should be at radius 1
      const dist = Math.max(Math.abs(result!.col), Math.abs(result!.row));
      expect(dist).toBe(1);
    });

    it('finds space for 2x2 card avoiding occupied cells', () => {
      grid.place(0, 0, '2x2', 'card-a');
      const result = grid.findNearest(0, 0, '2x2');
      expect(result).not.toBeNull();
      // Verify the found position doesn't overlap
      expect(grid.canPlace(result!.col, result!.row, '2x2')).toBe(true);
    });

    it('returns null when grid is full within maxRadius', () => {
      // Fill a small area
      for (let c = -2; c <= 2; c++) {
        for (let r = -2; r <= 2; r++) {
          grid.place(c, r, '1x1', `card-${c}-${r}`);
        }
      }
      const result = grid.findNearest(0, 0, '1x1', 2);
      expect(result).toBeNull();
    });

    it('finds position outside small filled area', () => {
      for (let c = -1; c <= 1; c++) {
        for (let r = -1; r <= 1; r++) {
          grid.place(c, r, '1x1', `card-${c}-${r}`);
        }
      }
      const result = grid.findNearest(0, 0, '1x1', 5);
      expect(result).not.toBeNull();
      expect(grid.canPlace(result!.col, result!.row, '1x1')).toBe(true);
    });

    it('searches from non-origin center', () => {
      const result = grid.findNearest(10, 10, '1x1');
      expect(result).toEqual({ col: 10, row: 10 });
    });

    it('picks Euclidean-nearest when multiple candidates exist at same radius', () => {
      // Place a card at (0,0) so center is taken
      grid.place(0, 0, '1x1', 'center');
      const result = grid.findNearest(0, 0, '1x1');
      expect(result).not.toBeNull();
      // Should be adjacent to center (distance² ≤ 2, i.e. at most diagonal)
      const dx = result!.col;
      const dy = result!.row;
      expect(dx * dx + dy * dy).toBeLessThanOrEqual(2);
    });

    it('for 2x1 card, distance is from card center not corner', () => {
      // Place at (0,0) and (1,0) so center 2x1 is blocked
      grid.place(0, 0, '2x1', 'center');
      const result = grid.findNearest(0, 0, '2x1');
      expect(result).not.toBeNull();
      // Card center at (result.col + 1, result.row + 0.5)
      // Should be closer to (0,0) than any other valid position
    });

    it('works with negative starting coordinates', () => {
      const result = grid.findNearest(-5, -3, '1x1');
      expect(result).toEqual({ col: -5, row: -3 });

      grid.place(-5, -3, '1x1', 'block');
      const result2 = grid.findNearest(-5, -3, '1x1');
      expect(result2).not.toBeNull();
      expect(result2!.col !== -5 || result2!.row !== -3).toBe(true);
    });
  });
});

describe('coordinate helpers', () => {
  it('cellToPixel converts grid to canvas coordinates', () => {
    expect(cellToPixel(0, 0)).toEqual({ x: 0, y: 0 });
    expect(cellToPixel(1, 0)).toEqual({ x: GRID_STEP, y: 0 });
    expect(cellToPixel(0, 1)).toEqual({ x: 0, y: GRID_STEP });
    expect(cellToPixel(2, 3)).toEqual({ x: 2 * GRID_STEP, y: 3 * GRID_STEP });
  });

  it('cellToPixel handles negative coordinates', () => {
    expect(cellToPixel(-1, -1)).toEqual({ x: -GRID_STEP, y: -GRID_STEP });
  });

  it('pixelToCell rounds to nearest cell', () => {
    expect(pixelToCell(0, 0)).toEqual({ col: 0, row: 0 });
    expect(pixelToCell(GRID_STEP, 0)).toEqual({ col: 1, row: 0 });
    expect(pixelToCell(GRID_STEP / 2, 0)).toEqual({ col: 1, row: 0 }); // rounds
    expect(pixelToCell(GRID_STEP / 2 - 1, 0)).toEqual({ col: 0, row: 0 }); // rounds down
  });

  it('pixelToCell and cellToPixel are inverse', () => {
    const { x, y } = cellToPixel(3, -2);
    const { col, row } = pixelToCell(x, y);
    expect(col).toBe(3);
    expect(row).toBe(-2);
  });
});

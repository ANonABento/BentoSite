/**
 * 2048 - Game logic hooks
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { TileData, GameState, GameStatus, Direction, MoveResult } from './Game2048.types';
import {
  GRID_SIZE,
  SPAWN_PROBABILITY_2,
  WIN_VALUE,
  KEY_MAPPINGS,
  SWIPE_THRESHOLD,
} from './Game2048.config';

let tileIdCounter = 0;

function generateTileId(): string {
  return `tile-${++tileIdCounter}`;
}

function createEmptyGrid(): (TileData | null)[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => null)
  );
}

function getEmptyCells(grid: (TileData | null)[][]): [number, number][] {
  const empty: [number, number][] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === null) {
        empty.push([row, col]);
      }
    }
  }
  return empty;
}

function spawnTile(grid: (TileData | null)[][]): TileData | null {
  const emptyCells = getEmptyCells(grid);
  if (emptyCells.length === 0) return null;

  const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const value = Math.random() < SPAWN_PROBABILITY_2 ? 2 : 4;

  const tile: TileData = {
    id: generateTileId(),
    value,
    row,
    col,
    isNew: true,
    isMerged: false,
  };

  grid[row][col] = tile;
  return tile;
}

function cloneGrid(grid: (TileData | null)[][]): (TileData | null)[][] {
  return grid.map((row) =>
    row.map((cell) => (cell ? { ...cell, isNew: false, isMerged: false } : null))
  );
}

function moveDirection(
  grid: (TileData | null)[][],
  direction: Direction
): MoveResult {
  const newGrid = cloneGrid(grid);
  let scoreGained = 0;
  let moved = false;
  let won = false;

  const processLine = (line: (TileData | null)[]): (TileData | null)[] => {
    // Filter out nulls
    const tiles = line.filter((t): t is TileData => t !== null);
    const result: (TileData | null)[] = [];

    let i = 0;
    while (i < tiles.length) {
      const current = tiles[i];
      const next = tiles[i + 1];

      if (next && current.value === next.value) {
        // Merge tiles
        const mergedValue = current.value * 2;
        const mergedTile: TileData = {
          id: generateTileId(),
          value: mergedValue,
          row: 0, // Will be updated
          col: 0, // Will be updated
          isNew: false,
          isMerged: true,
        };
        result.push(mergedTile);
        scoreGained += mergedValue;
        if (mergedValue >= WIN_VALUE) won = true;
        i += 2;
      } else {
        result.push({ ...current, isMerged: false });
        i += 1;
      }
    }

    // Pad with nulls
    while (result.length < GRID_SIZE) {
      result.push(null);
    }

    return result;
  };

  if (direction === 'left' || direction === 'right') {
    for (let row = 0; row < GRID_SIZE; row++) {
      const line = [...newGrid[row]];
      if (direction === 'right') line.reverse();

      const processed = processLine(line);
      if (direction === 'right') processed.reverse();

      for (let col = 0; col < GRID_SIZE; col++) {
        const tile = processed[col];
        if (tile) {
          tile.row = row;
          tile.col = col;
        }
        if (
          (newGrid[row][col]?.id !== processed[col]?.id) ||
          (newGrid[row][col]?.value !== processed[col]?.value)
        ) {
          moved = true;
        }
        newGrid[row][col] = tile;
      }
    }
  } else {
    for (let col = 0; col < GRID_SIZE; col++) {
      const line: (TileData | null)[] = [];
      for (let row = 0; row < GRID_SIZE; row++) {
        line.push(newGrid[row][col]);
      }
      if (direction === 'down') line.reverse();

      const processed = processLine(line);
      if (direction === 'down') processed.reverse();

      for (let row = 0; row < GRID_SIZE; row++) {
        const tile = processed[row];
        if (tile) {
          tile.row = row;
          tile.col = col;
        }
        if (
          (newGrid[row][col]?.id !== processed[row]?.id) ||
          (newGrid[row][col]?.value !== processed[row]?.value)
        ) {
          moved = true;
        }
        newGrid[row][col] = tile;
      }
    }
  }

  // Collect all tiles
  const tiles: TileData[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const tile = newGrid[row][col];
      if (tile) tiles.push(tile);
    }
  }

  return { grid: newGrid, tiles, scoreGained, moved, won };
}

function canMove(grid: (TileData | null)[][]): boolean {
  // Check for empty cells
  if (getEmptyCells(grid).length > 0) return true;

  // Check for possible merges
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const current = grid[row][col];
      if (!current) continue;

      // Check right neighbor
      if (col < GRID_SIZE - 1 && grid[row][col + 1]?.value === current.value) {
        return true;
      }
      // Check bottom neighbor
      if (row < GRID_SIZE - 1 && grid[row + 1][col]?.value === current.value) {
        return true;
      }
    }
  }

  return false;
}

export function useGame2048() {
  const [state, setState] = useState<GameState>(() => {
    const grid = createEmptyGrid();
    spawnTile(grid);
    spawnTile(grid);

    const tiles: TileData[] = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const tile = grid[row][col];
        if (tile) tiles.push(tile);
      }
    }

    return {
      grid,
      tiles,
      score: 0,
      bestScore: 0,
      status: 'playing',
      hasWon: false,
      continueAfterWin: false,
    };
  });

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const move = useCallback((direction: Direction) => {
    setState((s) => {
      if (s.status === 'lost') return s;
      if (s.status === 'won' && !s.continueAfterWin) return s;

      const result = moveDirection(s.grid, direction);

      if (!result.moved) return s;

      // Spawn new tile
      const newTile = spawnTile(result.grid);
      if (newTile) {
        result.tiles.push(newTile);
      }

      const newScore = s.score + result.scoreGained;
      const newBestScore = Math.max(s.bestScore, newScore);
      const hasWon = s.hasWon || result.won;

      // Check for game over
      const isGameOver = !canMove(result.grid);

      let newStatus: GameStatus = s.status;
      if (isGameOver) {
        newStatus = 'lost';
      } else if (result.won && !s.hasWon) {
        newStatus = 'won';
      }

      return {
        ...s,
        grid: result.grid,
        tiles: result.tiles,
        score: newScore,
        bestScore: newBestScore,
        status: newStatus,
        hasWon,
      };
    });
  }, []);

  const continueGame = useCallback(() => {
    setState((s) => ({
      ...s,
      status: 'playing',
      continueAfterWin: true,
    }));
  }, []);

  const resetGame = useCallback(() => {
    tileIdCounter = 0;
    const grid = createEmptyGrid();
    spawnTile(grid);
    spawnTile(grid);

    const tiles: TileData[] = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const tile = grid[row][col];
        if (tile) tiles.push(tile);
      }
    }

    setState((s) => ({
      grid,
      tiles,
      score: 0,
      bestScore: s.bestScore,
      status: 'playing',
      hasWon: false,
      continueAfterWin: false,
    }));
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const direction = KEY_MAPPINGS[e.key];
      if (direction) {
        e.preventDefault();
        move(direction);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Touch controls
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    touchStartRef.current = null;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < SWIPE_THRESHOLD) return;

    if (absDx > absDy) {
      move(dx > 0 ? 'right' : 'left');
    } else {
      move(dy > 0 ? 'down' : 'up');
    }
  }, [move]);

  return {
    tiles: state.tiles,
    score: state.score,
    bestScore: state.bestScore,
    status: state.status,
    hasWon: state.hasWon,
    move,
    continueGame,
    resetGame,
    handleTouchStart,
    handleTouchEnd,
  };
}

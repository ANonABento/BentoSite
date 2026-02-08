/**
 * Minesweeper - Game logic hooks
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Cell, Difficulty, GameState, GameStatus } from './Minesweeper.types';
import { DIFFICULTY_CONFIGS } from './Minesweeper.config';

function createEmptyGrid(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      row,
      col,
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  );
}

function placeMines(
  grid: Cell[][],
  mineCount: number,
  safeRow: number,
  safeCol: number
): void {
  const rows = grid.length;
  const cols = grid[0].length;
  let placed = 0;

  // Get safe zone (3x3 around first click)
  const isSafe = (r: number, c: number) =>
    Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1;

  while (placed < mineCount) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);

    if (!grid[row][col].isMine && !isSafe(row, col)) {
      grid[row][col].isMine = true;
      placed++;
    }
  }
}

function countAdjacentMines(grid: Cell[][], row: number, col: number): number {
  const rows = grid.length;
  const cols = grid[0].length;
  let count = 0;

  for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
    for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
      if (grid[r][c].isMine) count++;
    }
  }

  return count;
}

function calculateAllAdjacentMines(grid: Cell[][]): void {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      if (!grid[row][col].isMine) {
        grid[row][col].adjacentMines = countAdjacentMines(grid, row, col);
      }
    }
  }
}

function floodFill(grid: Cell[][], startRow: number, startCol: number): void {
  const rows = grid.length;
  const cols = grid[0].length;
  const stack: [number, number][] = [[startRow, startCol]];

  while (stack.length > 0) {
    const [row, col] = stack.pop()!;
    const cell = grid[row][col];

    if (cell.isRevealed || cell.isFlagged || cell.isMine) continue;

    cell.isRevealed = true;

    if (cell.adjacentMines === 0) {
      for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
          if (!grid[r][c].isRevealed) {
            stack.push([r, c]);
          }
        }
      }
    }
  }
}

function checkWin(grid: Cell[][]): boolean {
  for (const row of grid) {
    for (const cell of row) {
      if (!cell.isMine && !cell.isRevealed) return false;
    }
  }
  return true;
}

function revealAllMines(grid: Cell[][]): void {
  for (const row of grid) {
    for (const cell of row) {
      if (cell.isMine) {
        cell.isRevealed = true;
      }
    }
  }
}

export function useMinesweeper(initialDifficulty: Difficulty = 'beginner') {
  const [state, setState] = useState<GameState>(() => {
    const config = DIFFICULTY_CONFIGS[initialDifficulty];
    return {
      grid: createEmptyGrid(config.rows, config.cols),
      status: 'idle',
      difficulty: initialDifficulty,
      minesRemaining: config.mines,
      startTime: null,
      elapsedTime: 0,
      isFirstClick: true,
    };
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    if (state.status === 'playing' && state.startTime) {
      timerRef.current = setInterval(() => {
        setState((s) => ({
          ...s,
          elapsedTime: Math.floor((Date.now() - s.startTime!) / 1000),
        }));
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.status, state.startTime]);

  const resetGame = useCallback((difficulty?: Difficulty) => {
    const diff = difficulty ?? state.difficulty;
    const config = DIFFICULTY_CONFIGS[diff];

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setState({
      grid: createEmptyGrid(config.rows, config.cols),
      status: 'idle',
      difficulty: diff,
      minesRemaining: config.mines,
      startTime: null,
      elapsedTime: 0,
      isFirstClick: true,
    });
  }, [state.difficulty]);

  const revealCell = useCallback((row: number, col: number) => {
    setState((s) => {
      if (s.status === 'won' || s.status === 'lost') return s;

      const newGrid = s.grid.map((r) => r.map((c) => ({ ...c })));
      const cell = newGrid[row][col];

      if (cell.isRevealed || cell.isFlagged) return s;

      let newStatus: GameStatus = s.status;
      let newStartTime = s.startTime;

      // First click - place mines avoiding this cell
      if (s.isFirstClick) {
        const config = DIFFICULTY_CONFIGS[s.difficulty];
        placeMines(newGrid, config.mines, row, col);
        calculateAllAdjacentMines(newGrid);
        newStartTime = Date.now();
        newStatus = 'playing';
      }

      // Hit a mine
      if (newGrid[row][col].isMine) {
        revealAllMines(newGrid);
        return {
          ...s,
          grid: newGrid,
          status: 'lost',
          startTime: newStartTime,
          isFirstClick: false,
        };
      }

      // Reveal cell(s)
      floodFill(newGrid, row, col);

      // Check for win
      if (checkWin(newGrid)) {
        newStatus = 'won';
      }

      return {
        ...s,
        grid: newGrid,
        status: newStatus,
        startTime: newStartTime,
        isFirstClick: false,
      };
    });
  }, []);

  const toggleFlag = useCallback((row: number, col: number) => {
    setState((s) => {
      if (s.status === 'won' || s.status === 'lost') return s;

      const cell = s.grid[row][col];
      if (cell.isRevealed) return s;

      const newGrid = s.grid.map((r) => r.map((c) => ({ ...c })));
      const newCell = newGrid[row][col];
      newCell.isFlagged = !newCell.isFlagged;

      const flagDelta = newCell.isFlagged ? -1 : 1;

      return {
        ...s,
        grid: newGrid,
        minesRemaining: s.minesRemaining + flagDelta,
      };
    });
  }, []);

  const chordReveal = useCallback((row: number, col: number) => {
    setState((s) => {
      if (s.status !== 'playing') return s;

      const cell = s.grid[row][col];
      if (!cell.isRevealed || cell.adjacentMines === 0) return s;

      // Count adjacent flags
      let flagCount = 0;
      const rows = s.grid.length;
      const cols = s.grid[0].length;

      for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
          if (s.grid[r][c].isFlagged) flagCount++;
        }
      }

      // Only chord if flag count matches adjacent mines
      if (flagCount !== cell.adjacentMines) return s;

      const newGrid = s.grid.map((r) => r.map((c) => ({ ...c })));
      let hitMine = false;

      for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
          const neighbor = newGrid[r][c];
          if (!neighbor.isRevealed && !neighbor.isFlagged) {
            if (neighbor.isMine) {
              hitMine = true;
            } else {
              floodFill(newGrid, r, c);
            }
          }
        }
      }

      if (hitMine) {
        revealAllMines(newGrid);
        return { ...s, grid: newGrid, status: 'lost' };
      }

      const won = checkWin(newGrid);
      return { ...s, grid: newGrid, status: won ? 'won' : s.status };
    });
  }, []);

  return {
    grid: state.grid,
    status: state.status,
    difficulty: state.difficulty,
    minesRemaining: state.minesRemaining,
    elapsedTime: state.elapsedTime,
    revealCell,
    toggleFlag,
    chordReveal,
    resetGame,
  };
}

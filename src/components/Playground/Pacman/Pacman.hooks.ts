/**
 * Pacman - Game logic hooks
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Direction, GameState, Ghost, CellType } from './Pacman.types';
import {
  parseMaze,
  INITIAL_LIVES,
  DOT_SCORE,
  POWER_PELLET_SCORE,
  GHOST_SCORE_BASE,
  FRIGHTENED_DURATION,
  GHOST_SPEED,
  PACMAN_SPEED,
  KEY_MAPPINGS,
  MAZE_WIDTH,
  MAZE_HEIGHT,
} from './Pacman.config';

function createInitialState(): GameState {
  const { maze, ghostSpawn, pacmanSpawn } = parseMaze();

  // Count dots
  let dotsRemaining = 0;
  for (const row of maze) {
    for (const cell of row) {
      if (cell === 'dot' || cell === 'powerPellet') {
        dotsRemaining++;
      }
    }
  }

  // Create ghosts
  const ghosts: Ghost[] = [
    {
      id: 'blinky',
      color: '#ef4444',
      position: { x: ghostSpawn[0]?.x ?? 14, y: ghostSpawn[0]?.y ?? 14 },
      direction: 'left',
      speed: GHOST_SPEED,
      mode: 'scatter',
      frightened: false,
      eaten: false,
      targetPosition: { x: 0, y: 0 },
    },
    {
      id: 'pinky',
      color: '#f472b6',
      position: { x: ghostSpawn[1]?.x ?? 13, y: ghostSpawn[1]?.y ?? 14 },
      direction: 'up',
      speed: GHOST_SPEED * 0.95,
      mode: 'scatter',
      frightened: false,
      eaten: false,
      targetPosition: { x: 0, y: 0 },
    },
    {
      id: 'inky',
      color: '#06b6d4',
      position: { x: ghostSpawn[2]?.x ?? 15, y: ghostSpawn[2]?.y ?? 14 },
      direction: 'up',
      speed: GHOST_SPEED * 0.9,
      mode: 'scatter',
      frightened: false,
      eaten: false,
      targetPosition: { x: 0, y: 0 },
    },
    {
      id: 'clyde',
      color: '#f97316',
      position: { x: ghostSpawn[3]?.x ?? 16, y: ghostSpawn[3]?.y ?? 14 },
      direction: 'right',
      speed: GHOST_SPEED * 0.85,
      mode: 'scatter',
      frightened: false,
      eaten: false,
      targetPosition: { x: 0, y: 0 },
    },
  ];

  return {
    status: 'idle',
    pacman: {
      position: { x: pacmanSpawn.x, y: pacmanSpawn.y },
      direction: null,
      speed: PACMAN_SPEED,
    },
    ghosts,
    maze,
    score: 0,
    lives: INITIAL_LIVES,
    dotsRemaining,
    level: 1,
    frightTimeRemaining: 0,
  };
}

function isWall(maze: CellType[][], x: number, y: number): boolean {
  if (y < 0 || y >= maze.length || x < 0 || x >= maze[0].length) {
    // Tunnel wrap
    return false;
  }
  return maze[y][x] === 'wall';
}

function getNextPosition(x: number, y: number, direction: Direction): { x: number, y: number } {
  switch (direction) {
    case 'up': return { x, y: y - 1 };
    case 'down': return { x, y: y + 1 };
    case 'left': return { x: x - 1, y };
    case 'right': return { x: x + 1, y };
    default: return { x, y };
  }
}

function wrapPosition(x: number, y: number): { x: number, y: number } {
  let newX = x;
  let newY = y;

  if (x < 0) newX = MAZE_WIDTH - 1;
  else if (x >= MAZE_WIDTH) newX = 0;

  if (y < 0) newY = MAZE_HEIGHT - 1;
  else if (y >= MAZE_HEIGHT) newY = 0;

  return { x: newX, y: newY };
}

export function usePacman() {
  const [state, setState] = useState<GameState>(createInitialState);
  const nextDirectionRef = useRef<Direction>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const direction = KEY_MAPPINGS[e.key];
      if (direction) {
        e.preventDefault();
        nextDirectionRef.current = direction;

        // If game is idle, start it
        setState((s) => {
          if (s.status === 'idle') {
            return { ...s, status: 'playing' };
          }
          return s;
        });
      }

      // Pause with space or escape
      if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        setState((s) => {
          if (s.status === 'playing') {
            return { ...s, status: 'paused' };
          } else if (s.status === 'paused') {
            return { ...s, status: 'playing' };
          }
          return s;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Game loop
  useEffect(() => {
    if (state.status !== 'playing') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const gameLoop = (timestamp: number) => {
      const delta = timestamp - lastTimeRef.current;

      if (delta >= 100) { // ~10 FPS for grid-based movement
        lastTimeRef.current = timestamp;

        setState((s) => {
          if (s.status !== 'playing') return s;

          let newState = { ...s };
          const pacman = { ...s.pacman };
          const maze = s.maze.map((row) => [...row]);

          // Try to change direction
          if (nextDirectionRef.current) {
            const testPos = getNextPosition(
              Math.round(pacman.position.x),
              Math.round(pacman.position.y),
              nextDirectionRef.current
            );
            if (!isWall(maze, testPos.x, testPos.y)) {
              pacman.direction = nextDirectionRef.current;
            }
          }

          // Move pacman
          if (pacman.direction) {
            const nextPos = getNextPosition(
              Math.round(pacman.position.x),
              Math.round(pacman.position.y),
              pacman.direction
            );
            const wrapped = wrapPosition(nextPos.x, nextPos.y);

            if (!isWall(maze, wrapped.x, wrapped.y)) {
              pacman.position = wrapped;

              // Check for dot/pellet
              const cell = maze[wrapped.y]?.[wrapped.x];
              if (cell === 'dot') {
                maze[wrapped.y][wrapped.x] = 'empty';
                newState.score += DOT_SCORE;
                newState.dotsRemaining--;
              } else if (cell === 'powerPellet') {
                maze[wrapped.y][wrapped.x] = 'empty';
                newState.score += POWER_PELLET_SCORE;
                newState.dotsRemaining--;
                newState.frightTimeRemaining = FRIGHTENED_DURATION;
                // Make ghosts frightened
                newState.ghosts = s.ghosts.map((g) => ({
                  ...g,
                  frightened: true,
                  mode: 'frightened' as const,
                }));
              }
            }
          }

          newState.pacman = pacman;
          newState.maze = maze;

          // Update ghosts
          newState.ghosts = s.ghosts.map((ghost) => {
            const g = { ...ghost };

            // Simple AI: move toward/away from pacman
            const px = Math.round(pacman.position.x);
            const py = Math.round(pacman.position.y);
            const gx = Math.round(g.position.x);
            const gy = Math.round(g.position.y);

            // Determine possible moves
            const possibleMoves: Direction[] = ['up', 'down', 'left', 'right'];
            const validMoves = possibleMoves.filter((dir) => {
              const next = getNextPosition(gx, gy, dir);
              const wrapped = wrapPosition(next.x, next.y);
              return !isWall(maze, wrapped.x, wrapped.y);
            });

            if (validMoves.length > 0) {
              if (g.frightened) {
                // Run away from pacman (random valid move)
                g.direction = validMoves[Math.floor(Math.random() * validMoves.length)];
              } else {
                // Chase pacman (simple: prefer direction toward pacman)
                const dx = px - gx;
                const dy = py - gy;

                let preferred: Direction;
                if (Math.abs(dx) > Math.abs(dy)) {
                  preferred = dx > 0 ? 'right' : 'left';
                } else {
                  preferred = dy > 0 ? 'down' : 'up';
                }

                if (validMoves.includes(preferred)) {
                  g.direction = preferred;
                } else {
                  g.direction = validMoves[Math.floor(Math.random() * validMoves.length)];
                }
              }

              // Move ghost
              if (g.direction) {
                const nextPos = getNextPosition(gx, gy, g.direction);
                const wrapped = wrapPosition(nextPos.x, nextPos.y);
                g.position = wrapped;
              }
            }

            return g;
          });

          // Update frightened timer
          if (newState.frightTimeRemaining > 0) {
            newState.frightTimeRemaining -= delta;
            if (newState.frightTimeRemaining <= 0) {
              newState.frightTimeRemaining = 0;
              newState.ghosts = newState.ghosts.map((g) => ({
                ...g,
                frightened: false,
                mode: 'chase' as const,
              }));
            }
          }

          // Check ghost collisions
          const pacX = Math.round(pacman.position.x);
          const pacY = Math.round(pacman.position.y);

          for (let i = 0; i < newState.ghosts.length; i++) {
            const ghost = newState.ghosts[i];
            const gX = Math.round(ghost.position.x);
            const gY = Math.round(ghost.position.y);

            if (pacX === gX && pacY === gY) {
              if (ghost.frightened && !ghost.eaten) {
                // Eat ghost
                newState.ghosts[i] = { ...ghost, eaten: true };
                newState.score += GHOST_SCORE_BASE * (2 ** i);
              } else if (!ghost.eaten) {
                // Lose life
                newState.lives--;
                if (newState.lives <= 0) {
                  return { ...newState, status: 'lost' };
                }
                // Reset positions
                const { pacmanSpawn, ghostSpawn } = parseMaze();
                newState.pacman = {
                  ...pacman,
                  position: pacmanSpawn,
                  direction: null,
                };
                newState.ghosts = newState.ghosts.map((g, idx) => ({
                  ...g,
                  position: ghostSpawn[idx] || { x: 14, y: 14 },
                  frightened: false,
                  eaten: false,
                  mode: 'scatter' as const,
                }));
                nextDirectionRef.current = null;
                return { ...newState, status: 'paused' };
              }
            }
          }

          // Check win condition
          if (newState.dotsRemaining <= 0) {
            return { ...newState, status: 'won' };
          }

          return newState;
        });
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.status]);

  const startGame = useCallback(() => {
    setState(createInitialState());
    setState((s) => ({ ...s, status: 'playing' }));
  }, []);

  const resetGame = useCallback(() => {
    nextDirectionRef.current = null;
    setState(createInitialState());
  }, []);

  const togglePause = useCallback(() => {
    setState((s) => {
      if (s.status === 'playing') return { ...s, status: 'paused' };
      if (s.status === 'paused') return { ...s, status: 'playing' };
      return s;
    });
  }, []);

  // Touch controls
  const handleSwipe = useCallback((direction: Direction) => {
    nextDirectionRef.current = direction;
    setState((s) => {
      if (s.status === 'idle') {
        return { ...s, status: 'playing' };
      }
      return s;
    });
  }, []);

  return {
    ...state,
    startGame,
    resetGame,
    togglePause,
    handleSwipe,
  };
}

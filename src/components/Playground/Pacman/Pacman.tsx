'use client';

import { m } from 'framer-motion';
import { useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Heart, Ghost } from 'lucide-react';
import { GameLayout, ResultsScreen } from '../shared';
import { usePacman } from './Pacman.hooks';
import { useHighScores, useIsMobile } from '../Playground.hooks';
import { isNewHighScore } from '../Playground.utils';
import {
  CELL_SIZE,
  CELL_SIZE_MOBILE,
  MAZE_WIDTH,
  MAZE_HEIGHT,
  COLORS,
} from './Pacman.config';
import { springs } from '../design';

export function Pacman() {
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastSavedRunRef = useRef<string | null>(null);

  const {
    status,
    pauseReason,
    pacman,
    ghosts,
    maze,
    score,
    lives,
    dotsRemaining,
    frightTimeRemaining,
    startGame,
    resetGame,
    togglePause,
    handleSwipe,
  } = usePacman();

  const { scores, saveScore } = useHighScores('pacman');

  // Save score on game end
  useEffect(() => {
    if (status === 'won' || status === 'lost') {
      const runKey = `${status}:${score}:${lives}:${dotsRemaining}`;
      if (lastSavedRunRef.current === runKey) {
        return;
      }

      const currentHigh = scores?.highScore ?? 0;
      const gamesPlayed = (scores?.gamesPlayed ?? 0) + 1;
      if (score > currentHigh) {
        saveScore({ highScore: score, gamesPlayed });
      } else {
        saveScore({ highScore: currentHigh, gamesPlayed });
      }
      lastSavedRunRef.current = runKey;
    } else {
      lastSavedRunRef.current = null;
    }
  }, [status, score, scores, saveScore, lives, dotsRemaining]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = isMobile ? CELL_SIZE_MOBILE : CELL_SIZE;
    canvas.width = MAZE_WIDTH * cellSize;
    canvas.height = MAZE_HEIGHT * cellSize;

    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw maze
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        const cell = maze[y][x];
        const px = x * cellSize;
        const py = y * cellSize;

        switch (cell) {
          case 'wall':
            ctx.fillStyle = COLORS.wall;
            ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
            break;
          case 'dot':
            ctx.fillStyle = COLORS.dot;
            ctx.beginPath();
            ctx.arc(px + cellSize / 2, py + cellSize / 2, cellSize / 8, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'powerPellet':
            ctx.fillStyle = COLORS.powerPellet;
            ctx.beginPath();
            ctx.arc(px + cellSize / 2, py + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
      }
    }

    // Draw ghosts
    for (const ghost of ghosts) {
      const gx = ghost.position.x * cellSize;
      const gy = ghost.position.y * cellSize;
      const radius = cellSize / 2 - 2;

      // Ghost body
      ctx.fillStyle = ghost.frightened ? COLORS.frightened : ghost.color;
      if (ghost.eaten) {
        ctx.fillStyle = 'transparent';
      }

      // Draw ghost shape
      ctx.beginPath();
      ctx.arc(gx + cellSize / 2, gy + cellSize / 2 - 2, radius, Math.PI, 0);
      ctx.lineTo(gx + cellSize / 2 + radius, gy + cellSize - 2);

      // Wavy bottom
      const waves = 3;
      const waveWidth = (radius * 2) / waves;
      for (let i = 0; i < waves; i++) {
        const waveX = gx + cellSize / 2 + radius - (i + 1) * waveWidth;
        ctx.lineTo(waveX + waveWidth / 2, gy + cellSize - 6);
        ctx.lineTo(waveX, gy + cellSize - 2);
      }

      ctx.closePath();
      ctx.fill();

      // Eyes
      if (!ghost.eaten || ghost.frightened) {
        ctx.fillStyle = COLORS.eyes;
        const eyeSize = radius / 3;
        ctx.beginPath();
        ctx.arc(gx + cellSize / 2 - radius / 3, gy + cellSize / 2 - 3, eyeSize, 0, Math.PI * 2);
        ctx.arc(gx + cellSize / 2 + radius / 3, gy + cellSize / 2 - 3, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = ghost.frightened ? '#fff' : '#000';
        const pupilSize = eyeSize / 2;
        ctx.beginPath();
        ctx.arc(gx + cellSize / 2 - radius / 3, gy + cellSize / 2 - 3, pupilSize, 0, Math.PI * 2);
        ctx.arc(gx + cellSize / 2 + radius / 3, gy + cellSize / 2 - 3, pupilSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw Pacman
    const px = pacman.position.x * cellSize;
    const py = pacman.position.y * cellSize;
    const radius = cellSize / 2 - 2;

    ctx.fillStyle = COLORS.pacman;
    ctx.beginPath();

    // Mouth angle based on direction
    let startAngle = 0.2 * Math.PI;
    let endAngle = 1.8 * Math.PI;

    switch (pacman.direction) {
      case 'up':
        startAngle = 1.7 * Math.PI;
        endAngle = 1.3 * Math.PI;
        break;
      case 'down':
        startAngle = 0.7 * Math.PI;
        endAngle = 0.3 * Math.PI;
        break;
      case 'left':
        startAngle = 1.2 * Math.PI;
        endAngle = 0.8 * Math.PI;
        break;
      case 'right':
      default:
        startAngle = 0.2 * Math.PI;
        endAngle = 1.8 * Math.PI;
        break;
    }

    ctx.arc(px + cellSize / 2, py + cellSize / 2, radius, startAngle, endAngle);
    ctx.lineTo(px + cellSize / 2, py + cellSize / 2);
    ctx.closePath();
    ctx.fill();
  }, [maze, pacman, ghosts, isMobile]);

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

    const threshold = 30;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      handleSwipe(dx > 0 ? 'right' : 'left');
    } else {
      handleSwipe(dy > 0 ? 'down' : 'up');
    }
  }, [handleSwipe]);

  const cellSize = isMobile ? CELL_SIZE_MOBILE : CELL_SIZE;
  const canvasWidth = MAZE_WIDTH * cellSize;
  const canvasHeight = MAZE_HEIGHT * cellSize;

  const isGameOver = status === 'won' || status === 'lost';
  const isNewBest = isGameOver && isNewHighScore(score, scores?.highScore);

  return (
    <GameLayout
      title="Pacman"
      subtitle={status === 'playing' ? `Score: ${score}` : undefined}
      headerRight={
        status === 'playing' || status === 'paused' ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {Array.from({ length: lives }).map((_, i) => (
                <Heart key={i} className="w-4 h-4 text-[var(--pg-game-error)] fill-current" />
              ))}
            </div>
            <span className="font-mono text-sm text-[var(--pg-accent-gold)]">
              {score.toLocaleString()}
            </span>
          </div>
        ) : null
      }
    >
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        {/* Idle state */}
        {status === 'idle' && (
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springs.gentle}
            className="text-center mb-6"
          >
            <m.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--pg-accent-gold)]/10 text-[var(--pg-accent-gold)] mb-4"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={springs.bouncy}
            >
              <Ghost className="w-8 h-8" />
            </m.div>

            <h2 className="text-2xl font-bold text-[var(--pg-text-primary)] mb-2">
              Pacman
            </h2>
            <p className="text-sm text-[var(--pg-text-secondary)] mb-4">
              Eat all the dots, use power pellets to flip the chase, and watch for ghosts to recover after you eat them.
            </p>

            {scores?.highScore ? (
              <p className="text-xs text-[var(--pg-text-muted)] mb-4">
                High Score: <span className="font-mono text-[var(--pg-accent-gold)]">{scores.highScore}</span>
              </p>
            ) : null}

            <m.button
              onClick={startGame}
              className="px-6 py-3 rounded-lg bg-[var(--purple)] text-[var(--text-on-accent)] font-medium"
              aria-label="Start Pacman game"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play className="w-4 h-4 inline-block mr-2" />
              Start Game
            </m.button>
          </m.div>
        )}

        {/* Game canvas */}
        {(status === 'playing' || status === 'paused') && (
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            {/* Stats */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: lives }).map((_, i) => (
                  <Heart key={i} className="w-5 h-5 text-[var(--pg-game-error)] fill-current" />
                ))}
              </div>
              <div className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--pg-text-muted)]">
                {dotsRemaining} dots left
              </div>
              <m.button
                onClick={togglePause}
                className="p-2 rounded-lg bg-[var(--pg-bg-elevated)] hover:bg-[var(--pg-bg-hover)]"
                aria-label={status === 'paused' ? 'Resume Pacman' : 'Pause Pacman'}
                aria-pressed={status === 'paused'}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {status === 'paused' ? (
                  <Play className="w-5 h-5 text-[var(--pg-text-secondary)]" />
                ) : (
                  <Pause className="w-5 h-5 text-[var(--pg-text-secondary)]" />
                )}
              </m.button>
              <div className="font-mono text-lg text-[var(--pg-accent-gold)]">
                {score.toLocaleString()}
              </div>
            </div>

            {/* Canvas */}
            <div
              className="pg-border-subtle rounded-xl overflow-hidden border"
              style={{ touchAction: 'none' }}
            >
              <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="block"
                role="img"
                aria-label={`Pacman maze. Score ${score}. ${lives} lives. ${dotsRemaining} dots left. Use arrow keys or WASD to move.`}
                tabIndex={0}
              />
            </div>

            {/* Paused overlay */}
            {status === 'paused' && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center pg-overlay-panel-strong rounded-xl"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-2">
                    {pauseReason === 'lifeLost' ? 'Life Lost' : 'Paused'}
                  </div>
                  <p className="mb-4 text-sm text-white/75">
                    {pauseReason === 'lifeLost'
                      ? 'Take a beat, then jump back in from the spawn point.'
                      : 'Resume when you are ready.'}
                  </p>
                  <m.button
                    onClick={togglePause}
                    className="px-6 py-2 rounded-lg bg-[var(--purple)] text-[var(--text-on-accent)] font-medium"
                    aria-label="Resume Pacman"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Resume
                  </m.button>
                </div>
              </m.div>
            )}

            {/* Frightened indicator */}
            {frightTimeRemaining > 0 && (
              <div className="mt-2 text-center">
                <span className="text-xs text-[var(--pg-text-muted)]">
                  Power: <span className="font-mono text-[var(--pg-accent-gold)]">
                    {Math.ceil(frightTimeRemaining / 1000)}s
                  </span>
                </span>
              </div>
            )}

            {/* Controls hint */}
            <m.p
              className="text-center text-[var(--pg-text-muted)] text-xs mt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {isMobile ? 'Swipe to move' : 'Arrow keys or WASD to move · Space to pause'}
            </m.p>
          </m.div>
        )}

        {/* Results */}
        {isGameOver && (
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ResultsScreen
              title={status === 'won' ? 'You Win!' : 'Game Over'}
              isNewHighScore={isNewBest}
              onPlayAgain={resetGame}
              primaryStatIndex={0}
              stats={[
                { label: 'Score', value: score.toLocaleString(), highlight: true },
                { label: 'Dots Left', value: dotsRemaining.toString() },
                { label: 'High Score', value: (scores?.highScore ?? 0).toLocaleString() },
              ]}
            />
          </m.div>
        )}
      </div>
    </GameLayout>
  );
}

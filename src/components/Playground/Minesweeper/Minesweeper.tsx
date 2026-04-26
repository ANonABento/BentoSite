'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import { Grid3X3, Flag, Clock, RotateCcw, Trophy } from 'lucide-react';
import { GameLayout, ResultsScreen } from '../shared';
import { useMinesweeper } from './Minesweeper.hooks';
import { Cell } from './Cell';
import { useHighScores, useIsMobile } from '../Playground.hooks';
import { Difficulty } from './Minesweeper.types';
import { DIFFICULTY_CONFIGS, CELL_SIZE, CELL_SIZE_MOBILE } from './Minesweeper.config';
import { springs } from '../design';

export function Minesweeper() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('beginner');
  const isMobile = useIsMobile();

  const {
    grid,
    status,
    difficulty,
    minesRemaining,
    elapsedTime,
    revealCell,
    toggleFlag,
    chordReveal,
    resetGame,
  } = useMinesweeper(selectedDifficulty);

  const { scores, saveScore } = useHighScores('minesweeper');

  const isFinished = status === 'won' || status === 'lost';
  const currentBest = scores?.[difficulty]?.bestTime;
  const isNewBest = status === 'won' && (!currentBest || elapsedTime < currentBest);

  const handlePlayAgain = useCallback(() => {
    if (status === 'won') {
      const currentStats = scores?.[difficulty] ?? { bestTime: Infinity, gamesPlayed: 0, gamesWon: 0 };
      saveScore({
        ...(scores ?? {}),
        [difficulty]: {
          bestTime: Math.min(currentStats.bestTime, elapsedTime),
          gamesPlayed: currentStats.gamesPlayed + 1,
          gamesWon: currentStats.gamesWon + 1,
        },
      });
    } else if (status === 'lost') {
      const currentStats = scores?.[difficulty] ?? { bestTime: Infinity, gamesPlayed: 0, gamesWon: 0 };
      saveScore({
        ...(scores ?? {}),
        [difficulty]: {
          ...currentStats,
          gamesPlayed: currentStats.gamesPlayed + 1,
        },
      });
    }
    resetGame();
  }, [status, scores, difficulty, elapsedTime, saveScore, resetGame]);

  const handleDifficultyChange = (diff: Difficulty) => {
    setSelectedDifficulty(diff);
    resetGame(diff);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  const showIdle = status === 'idle';
  const showGame = status === 'playing' || status === 'idle';
  const showResults = isFinished;

  const cellSize = isMobile ? CELL_SIZE_MOBILE : CELL_SIZE;
  const gridWidth = grid[0]?.length * cellSize + (grid[0]?.length - 1) * 2;
  const gridHeight = grid.length * cellSize + (grid.length - 1) * 2;

  return (
    <GameLayout
      title="Minesweeper"
      subtitle={status === 'playing' ? DIFFICULTY_CONFIGS[difficulty].name : undefined}
      headerRight={
        status === 'playing' ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-[var(--pg-accent-gold)]" />
              <span className="font-mono text-sm text-[var(--pg-text-primary)]">
                {minesRemaining}
              </span>
            </div>
            <div className="pg-divider" />
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--pg-text-muted)]" />
              <span className="font-mono text-sm text-[var(--pg-text-primary)]">
                {formatTime(elapsedTime)}
              </span>
            </div>
          </div>
        ) : null
      }
    >
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <AnimatePresence mode="wait">
          {/* Difficulty selector (when idle) */}
          {showIdle && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={springs.gentle}
              className="text-center mb-8"
            >
              <motion.div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--purple)]/10 text-[var(--purple)] mb-4"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={springs.bouncy}
              >
                <Grid3X3 className="w-8 h-8" />
              </motion.div>

              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--pg-text-primary)] mb-2 tracking-tight">
                Minesweeper
              </h2>
              <p className="text-[var(--pg-text-secondary)] mb-6">
                Find all the mines without clicking on them.
              </p>

              {/* Difficulty buttons */}
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {(Object.keys(DIFFICULTY_CONFIGS) as Difficulty[]).map((diff) => {
                  const config = DIFFICULTY_CONFIGS[diff];
                  const stats = scores?.[diff];
                  return (
                    <motion.button
                      key={diff}
                      onClick={() => handleDifficultyChange(diff)}
                      aria-label={`Select ${config.name} difficulty, ${config.cols} by ${config.rows}, ${config.mines} mines`}
                      aria-pressed={selectedDifficulty === diff}
                      className={`
                        px-4 py-2 rounded-xl font-medium capitalize transition-all duration-200
                        ${selectedDifficulty === diff
                          ? 'bg-[var(--purple)] text-[var(--text-on-accent)] shadow-lg shadow-[var(--purple)]/25'
                          : 'pg-surface-panel text-[var(--pg-text-secondary)] hover:bg-[var(--pg-bg-hover)]'
                        }
                      `}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-sm">{config.name}</div>
                      <div className="text-xs opacity-70">
                        {config.cols}×{config.rows} · {config.mines} mines
                      </div>
                      {stats?.bestTime && stats.bestTime < Infinity && (
                        <div className="text-xs text-[var(--pg-accent-gold)] mt-1">
                          Best: {formatTime(stats.bestTime)}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <p className="text-xs text-[var(--pg-text-muted)]">
                Left-click to reveal · Right-click to flag
              </p>
            </motion.div>
          )}

          {/* Game grid */}
          {showGame && (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              {/* Stats bar */}
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-[var(--pg-accent-gold)]" />
                  <span className="font-mono text-lg text-[var(--pg-text-primary)]">
                    {minesRemaining}
                  </span>
                </div>
                <motion.button
                  onClick={() => resetGame()}
                  className="p-2 rounded-lg bg-[var(--pg-bg-elevated)] hover:bg-[var(--pg-bg-hover)] transition-colors"
                  aria-label="Start a new Minesweeper game"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="New Game (N)"
                >
                  <RotateCcw className="w-5 h-5 text-[var(--pg-text-secondary)]" />
                </motion.button>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--pg-text-muted)]" />
                  <span className="font-mono text-lg text-[var(--pg-text-primary)]">
                    {formatTime(elapsedTime)}
                  </span>
                </div>
              </div>

              {/* Grid */}
              <div
                className="pg-surface-frame pg-border-soft relative rounded-xl overflow-hidden p-2"
                style={{
                  maxWidth: '100%',
                  overflowX: 'auto',
                }}
              >
                <div
                  className="grid gap-0.5"
                  style={{
                    gridTemplateColumns: `repeat(${grid[0]?.length}, ${cellSize}px)`,
                    width: gridWidth,
                    height: gridHeight,
                  }}
                >
                  {grid.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <Cell
                        key={`${rowIndex}-${colIndex}`}
                        cell={cell}
                        gameOver={isFinished}
                        isMobile={isMobile}
                        onClick={() => revealCell(rowIndex, colIndex)}
                        onRightClick={() => toggleFlag(rowIndex, colIndex)}
                        onDoubleClick={() => chordReveal(rowIndex, colIndex)}
                      />
                    ))
                  )}
                </div>

                {/* Game over overlay */}
                {isFinished && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl"
                  >
                    <motion.div
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={springs.bouncy}
                      className="text-center"
                    >
                      {status === 'won' ? (
                        <Trophy className="w-12 h-12 text-[var(--pg-accent-gold)] mx-auto mb-2" />
                      ) : (
                        <span className="text-4xl">💥</span>
                      )}
                      <div className={`text-2xl font-bold ${status === 'won' ? 'text-[var(--pg-game-success)]' : 'text-[var(--pg-game-error)]'}`}>
                        {status === 'won' ? 'You Win!' : 'Game Over'}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </div>

              {/* Controls hint */}
              <motion.p
                className="text-center text-[var(--pg-text-muted)] text-xs mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {isMobile ? 'Tap to reveal · Long-press to flag' : 'Left-click to reveal · Right-click to flag · Double-click to chord'}
              </motion.p>
            </motion.div>
          )}

          {/* Results */}
          {showResults && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8"
            >
              <ResultsScreen
                title={status === 'won' ? 'Victory!' : 'Game Over'}
                isNewHighScore={isNewBest}
                onPlayAgain={handlePlayAgain}
                primaryStatIndex={0}
                stats={[
                  { label: 'Time', value: formatTime(elapsedTime), highlight: status === 'won' },
                  { label: 'Difficulty', value: DIFFICULTY_CONFIGS[difficulty].name },
                  { label: 'Mines', value: DIFFICULTY_CONFIGS[difficulty].mines },
                  ...(currentBest && currentBest < Infinity
                    ? [{ label: 'Best Time', value: formatTime(currentBest) }]
                    : []),
                ]}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameLayout>
  );
}

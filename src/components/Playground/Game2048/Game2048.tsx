'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useCallback } from 'react';
import { RotateCcw, Trophy, Grid2X2 } from 'lucide-react';
import { GameLayout, ResultsScreen } from '../shared';
import { useGame2048 } from './Game2048.hooks';
import { Tile } from './Tile';
import { useHighScores, useIsMobile } from '../Playground.hooks';
import {
  GRID_SIZE,
  CELL_SIZE,
  CELL_SIZE_MOBILE,
  CELL_GAP,
  CELL_GAP_MOBILE,
} from './Game2048.config';
import { springs } from '../design';

export function Game2048() {
  const isMobile = useIsMobile();

  const {
    tiles,
    score,
    bestScore,
    status,
    hasWon,
    continueGame,
    resetGame,
    handleTouchStart,
    handleTouchEnd,
  } = useGame2048();

  const { scores, saveScore } = useHighScores('game2048');

  // Save score when game ends
  useEffect(() => {
    if (status === 'lost' || (status === 'won' && !hasWon)) {
      const currentBest = scores?.bestScore ?? 0;
      const highestTile = Math.max(...tiles.map((t) => t.value), 0);
      const currentHighestTile = scores?.highestTile ?? 0;
      const gamesPlayed = (scores?.gamesPlayed ?? 0) + 1;

      saveScore({
        bestScore: Math.max(currentBest, score),
        highestTile: Math.max(currentHighestTile, highestTile),
        gamesPlayed,
      });
    }
  }, [status, hasWon, score, tiles, scores, saveScore]);

  const handlePlayAgain = useCallback(() => {
    resetGame();
  }, [resetGame]);

  const size = isMobile ? CELL_SIZE_MOBILE : CELL_SIZE;
  const gap = isMobile ? CELL_GAP_MOBILE : CELL_GAP;
  const gridSize = GRID_SIZE * size + (GRID_SIZE - 1) * gap + gap * 2;

  const isGameOver = status === 'lost';
  const showWinModal = status === 'won' && !hasWon;
  const savedBest = scores?.bestScore ?? 0;
  const isNewBest = status === 'lost' && score > savedBest;

  return (
    <GameLayout
      title="2048"
      subtitle={status === 'playing' ? `Score: ${score.toLocaleString()}` : undefined}
      headerRight={
        status === 'playing' ? (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-[var(--pg-text-muted)] uppercase tracking-wide">Best</div>
              <div className="font-mono text-sm text-[var(--pg-accent-gold)]">
                {Math.max(bestScore, savedBest).toLocaleString()}
              </div>
            </div>
          </div>
        ) : null
      }
    >
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <AnimatePresence mode="wait">
          {/* Game intro */}
          {status === 'playing' && tiles.length === 2 && score === 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center mb-6"
            >
              <motion.div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--pg-accent-primary)]/10 text-[var(--pg-accent-primary)] mb-4"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={springs.bouncy}
              >
                <Grid2X2 className="w-8 h-8" />
              </motion.div>
              <h2 className="text-2xl font-bold text-[var(--pg-text-primary)] mb-2">
                2048
              </h2>
              <p className="text-sm text-[var(--pg-text-secondary)]">
                Use arrow keys or swipe to combine tiles
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Score bar */}
        <div className="flex items-center gap-6 mb-4">
          <div className="text-center">
            <div className="text-xs text-[var(--pg-text-muted)] uppercase tracking-wide mb-1">
              Score
            </div>
            <motion.div
              key={score}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="font-mono text-2xl font-bold text-[var(--pg-text-primary)]"
            >
              {score.toLocaleString()}
            </motion.div>
          </div>

          <motion.button
            onClick={resetGame}
            className="p-2 rounded-lg bg-[var(--pg-bg-elevated)] hover:bg-[var(--pg-bg-hover)] transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="New Game"
            aria-label="Start a new 2048 game"
          >
            <RotateCcw className="w-5 h-5 text-[var(--pg-text-secondary)]" />
          </motion.button>

          <div className="text-center">
            <div className="text-xs text-[var(--pg-text-muted)] uppercase tracking-wide mb-1">
              Best
            </div>
            <div className="font-mono text-2xl font-bold text-[var(--pg-accent-primary)]">
              {Math.max(bestScore, savedBest).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Game grid */}
        <div
          className="relative rounded-xl overflow-hidden"
          role="application"
          aria-label={`2048 game board. Score ${score}. Use arrow keys or WASD to move tiles.`}
          tabIndex={0}
          style={{
            width: gridSize,
            height: gridSize,
            backgroundColor: 'rgba(187, 173, 160, 0.35)',
            padding: gap,
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Background grid cells */}
          <div
            className="grid absolute inset-0"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, ${size}px)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, ${size}px)`,
              gap: gap,
              padding: gap,
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg"
                style={{ backgroundColor: 'rgba(238, 228, 218, 0.35)' }}
              />
            ))}
          </div>

          {/* Tiles */}
          <div className="relative" style={{ width: gridSize - gap * 2, height: gridSize - gap * 2 }}>
            <AnimatePresence>
              {tiles.map((tile) => (
                <Tile key={tile.id} tile={tile} isMobile={isMobile} />
              ))}
            </AnimatePresence>
          </div>

          {/* Win overlay */}
          {showWinModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--pg-accent-primary)]/90 backdrop-blur-sm rounded-xl"
            >
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={springs.bouncy}
                className="text-center"
              >
                <Trophy className="w-16 h-16 text-white mx-auto mb-3" />
                <div className="text-4xl font-bold text-white mb-4">You Win!</div>
                <div className="flex gap-3">
                  <motion.button
                    onClick={continueGame}
                    className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium transition-colors"
                    aria-label="Keep playing after reaching 2048"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Keep Going
                  </motion.button>
                  <motion.button
                    onClick={resetGame}
                    className="px-4 py-2 rounded-lg bg-white text-[var(--pg-accent-primary)] font-medium transition-colors"
                    aria-label="Start a new 2048 game"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    New Game
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Game over overlay */}
          {isGameOver && (
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
                <div className="text-3xl font-bold text-[var(--pg-game-error)] mb-2">
                  Game Over
                </div>
                <div className="text-lg text-white/80 mb-4">
                  Final Score: {score.toLocaleString()}
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
          {isMobile ? 'Swipe to move tiles' : 'Arrow keys or WASD to move'}
        </motion.p>

        {/* Results screen for game over */}
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <ResultsScreen
              title="Game Over"
              isNewHighScore={isNewBest}
              onPlayAgain={handlePlayAgain}
              primaryStatIndex={0}
              stats={[
                { label: 'Score', value: score.toLocaleString(), highlight: true },
                { label: 'Best Tile', value: Math.max(...tiles.map((t) => t.value)).toString() },
                { label: 'Best Score', value: Math.max(bestScore, savedBest).toLocaleString() },
              ]}
            />
          </motion.div>
        )}
      </div>
    </GameLayout>
  );
}

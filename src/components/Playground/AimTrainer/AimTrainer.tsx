'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { Play, RotateCcw, Crosshair, Target } from 'lucide-react';
import { GameLayout, ResultsScreen } from '../shared';
import { Scene3D } from './Scene3D';
import { useAimTrainer } from './AimTrainer.hooks';
import { useHighScores } from '../Playground.hooks';
import { isNewHighScore } from '../Playground.utils';
import { GameMode } from './AimTrainer.types';
import { MODES, DURATIONS, TARGET_SIZES, DEFAULT_SENSITIVITY, MIN_SENSITIVITY, MAX_SENSITIVITY } from './AimTrainer.config';
import { springs } from '../design';

export function AimTrainer() {
  const [isLocked, setIsLocked] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const {
    status,
    targets,
    hits,
    misses,
    score,
    accuracy,
    timeRemaining,
    settings,
    startGame,
    resetGame,
    handleShot,
    updateSettings,
  } = useAimTrainer();

  const { scores, saveScore } = useHighScores('aimTrainer');

  // Save score on finish
  useEffect(() => {
    if (status === 'finished') {
      const modeKey = settings.mode;
      const currentBest = scores?.[modeKey]?.bestScore ?? 0;
      const currentBestAcc = scores?.[modeKey]?.bestAccuracy ?? 0;
      const gamesPlayed = (scores?.[modeKey]?.gamesPlayed ?? 0) + 1;

      saveScore({
        ...(scores ?? {}),
        [modeKey]: {
          bestScore: Math.max(currentBest, score),
          bestAccuracy: Math.max(currentBestAcc, accuracy),
          gamesPlayed,
        },
      });
    }
  }, [status, score, accuracy, settings.mode, scores, saveScore]);

  const handleLockChange = useCallback((locked: boolean) => {
    setIsLocked(locked);
    if (locked) {
      setShowInstructions(false);
    }
  }, []);

  const handleHit = useCallback((targetId: string) => {
    handleShot(targetId);
  }, [handleShot]);

  const handleMiss = useCallback(() => {
    if (status === 'playing') {
      handleShot(null);
    }
  }, [status, handleShot]);

  const handleStart = useCallback(() => {
    startGame();
    // Request pointer lock after starting
    document.body.requestPointerLock?.();
  }, [startGame]);

  const currentMode = MODES.find((m) => m.id === settings.mode);
  const modeScores = scores?.[settings.mode];
  const isNewBest = status === 'finished' && isNewHighScore(score, modeScores?.bestScore);

  return (
    <GameLayout
      title="Aim Trainer"
      subtitle={status === 'playing' ? `${currentMode?.name} - ${timeRemaining}s` : undefined}
      headerRight={
        status === 'playing' ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[var(--pg-game-success)]" />
              <span className="font-mono text-sm text-[var(--pg-text-primary)]">{hits}</span>
            </div>
            <div className="w-px h-5 bg-white/10" />
            <span className="font-mono text-lg text-[var(--pg-accent-gold)]">{score}</span>
          </div>
        ) : null
      }
    >
      <div className="flex-1 flex flex-col">
        {/* Idle/Settings state */}
        {status === 'idle' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springs.gentle}
              className="text-center w-full max-w-lg"
            >
              <motion.div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--pg-game-error)]/10 text-[var(--pg-game-error)] mb-4"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={springs.bouncy}
              >
                <Crosshair className="w-8 h-8" />
              </motion.div>

              <h2 className="text-2xl font-bold text-[var(--pg-text-primary)] mb-2">
                3D Aim Trainer
              </h2>
              <p className="text-sm text-[var(--pg-text-secondary)] mb-6">
                First-person target practice. Click on targets to score.
              </p>

              {/* Mode selector */}
              <div className="mb-4">
                <span className="text-xs text-[var(--pg-text-muted)] uppercase tracking-wide">Mode</span>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {MODES.map((mode) => (
                    <motion.button
                      key={mode.id}
                      onClick={() => updateSettings({ mode: mode.id as GameMode })}
                      className={`
                        px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${settings.mode === mode.id
                          ? 'bg-[var(--pg-game-error)] text-white'
                          : 'bg-[var(--pg-bg-elevated)] text-[var(--pg-text-secondary)] hover:bg-[var(--pg-bg-hover)]'
                        }
                      `}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {mode.name}
                    </motion.button>
                  ))}
                </div>
                {currentMode && (
                  <p className="text-xs text-[var(--pg-text-muted)] mt-2">
                    {currentMode.description}
                  </p>
                )}
              </div>

              {/* Duration selector */}
              <div className="mb-4">
                <span className="text-xs text-[var(--pg-text-muted)] uppercase tracking-wide">Duration</span>
                <div className="flex gap-2 justify-center mt-2">
                  {DURATIONS.map((d) => (
                    <motion.button
                      key={d}
                      onClick={() => updateSettings({ duration: d })}
                      className={`
                        px-4 py-2 rounded-lg font-mono text-sm transition-all
                        ${settings.duration === d
                          ? 'bg-[var(--purple)] text-white'
                          : 'bg-[var(--pg-bg-elevated)] text-[var(--pg-text-secondary)] hover:bg-[var(--pg-bg-hover)]'
                        }
                      `}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {d}s
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Sensitivity slider */}
              <div className="mb-6">
                <span className="text-xs text-[var(--pg-text-muted)] uppercase tracking-wide">
                  Sensitivity: {settings.sensitivity.toFixed(1)}
                </span>
                <input
                  type="range"
                  min={MIN_SENSITIVITY}
                  max={MAX_SENSITIVITY}
                  step={0.1}
                  value={settings.sensitivity}
                  onChange={(e) => updateSettings({ sensitivity: parseFloat(e.target.value) })}
                  className="w-full mt-2 h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[var(--purple)] [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>

              {/* Best score */}
              {modeScores?.bestScore ? (
                <div className="mb-6 inline-flex items-center gap-4 px-4 py-2 rounded-xl bg-[var(--pg-bg-elevated)] border border-white/[0.06]">
                  <span className="text-xs text-[var(--pg-text-muted)]">
                    Best: <span className="font-mono text-[var(--pg-accent-gold)]">{modeScores.bestScore}</span>
                  </span>
                  <span className="text-xs text-[var(--pg-text-muted)]">
                    Acc: <span className="font-mono text-[var(--pg-game-success)]">{modeScores.bestAccuracy}%</span>
                  </span>
                </div>
              ) : null}

              <motion.button
                onClick={handleStart}
                className="px-8 py-3 rounded-lg bg-[var(--pg-game-error)] text-white font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Play className="w-4 h-4 inline-block mr-2" />
                Start Training
              </motion.button>

              <p className="text-xs text-[var(--pg-text-muted)] mt-4">
                Click to lock mouse. Press ESC to exit.
              </p>
            </motion.div>
          </div>
        )}

        {/* Game state */}
        {status === 'playing' && (
          <div className="flex-1 relative">
            {/* 3D Scene */}
            <div className="absolute inset-0">
              <Scene3D
                targets={targets}
                sensitivity={settings.sensitivity}
                isPlaying={status === 'playing'}
                onHit={handleHit}
                onMiss={handleMiss}
                onLockChange={handleLockChange}
              />
            </div>

            {/* Crosshair overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative">
                <div className="absolute w-6 h-0.5 bg-white/80 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2" />
                <div className="absolute w-0.5 h-6 bg-white/80 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2" />
                <div className="absolute w-2 h-2 rounded-full border border-white/60 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2" />
              </div>
            </div>

            {/* HUD */}
            <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
              <div className="bg-black/50 backdrop-blur px-4 py-2 rounded-lg">
                <div className="text-xs text-[var(--pg-text-muted)]">Score</div>
                <div className="font-mono text-2xl text-[var(--pg-accent-gold)]">{score}</div>
              </div>
              <div className="bg-black/50 backdrop-blur px-4 py-2 rounded-lg text-center">
                <div className="text-xs text-[var(--pg-text-muted)]">Time</div>
                <div className="font-mono text-2xl text-white">{timeRemaining}</div>
              </div>
              <div className="bg-black/50 backdrop-blur px-4 py-2 rounded-lg text-right">
                <div className="text-xs text-[var(--pg-text-muted)]">Accuracy</div>
                <div className="font-mono text-2xl text-[var(--pg-game-success)]">{accuracy}%</div>
              </div>
            </div>

            {/* Instructions (shown briefly) */}
            {showInstructions && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center pointer-events-none"
              >
                <div className="bg-black/70 backdrop-blur px-6 py-3 rounded-xl">
                  <p className="text-white">Click anywhere to lock mouse and start aiming</p>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Results state */}
        {status === 'finished' && (
          <div className="flex-1 flex items-center justify-center p-6">
            <ResultsScreen
              title={currentMode?.name ?? 'Training Complete'}
              isNewHighScore={isNewBest}
              onPlayAgain={resetGame}
              primaryStatIndex={0}
              stats={[
                { label: 'Score', value: score.toString(), highlight: true },
                { label: 'Accuracy', value: `${accuracy}%` },
                { label: 'Hits', value: hits.toString() },
                { label: 'Misses', value: misses.toString() },
              ]}
            />
          </div>
        )}
      </div>
    </GameLayout>
  );
}

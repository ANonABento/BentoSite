'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Play, Crosshair, Target } from 'lucide-react';
import { GameLayout, ResultsScreen } from '../shared';
import { useAimTrainer } from './AimTrainer.hooks';
import { useHighScores } from '../Playground.hooks';
import { isNewHighScore } from '../Playground.utils';
import { GameMode } from './AimTrainer.types';
import { MODES, DURATIONS, MIN_SENSITIVITY, MAX_SENSITIVITY } from './AimTrainer.config';
import { springs } from '../design';

const Scene3D = dynamic(
  () => import('./Scene3D').then((mod) => mod.Scene3D),
  { ssr: false }
);

export function AimTrainer() {
  const [showInstructions, setShowInstructions] = useState(true);
  const lastSavedRunRef = useRef<string | null>(null);

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
      const runKey = `${settings.mode}:${score}:${accuracy}:${hits}:${misses}`;
      if (lastSavedRunRef.current === runKey) {
        return;
      }

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
      lastSavedRunRef.current = runKey;
    } else {
      lastSavedRunRef.current = null;
    }
  }, [status, score, accuracy, settings.mode, scores, saveScore, hits, misses]);

  useEffect(() => {
    if (status !== 'playing' && document.pointerLockElement) {
      document.exitPointerLock?.();
    }
  }, [status]);

  const handleLockChange = useCallback((locked: boolean) => {
    setShowInstructions(!locked);
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
            <div className="pg-divider" />
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
                First-person target practice. Tracking mode now moves targets and missed despawns count against your accuracy.
              </p>

              {/* Mode selector */}
              <div className="mb-4">
                <span className="text-xs text-[var(--pg-text-muted)] uppercase tracking-wide">Mode</span>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {MODES.map((mode) => (
                    <motion.button
                      key={mode.id}
                      onClick={() => updateSettings({ mode: mode.id as GameMode })}
                      aria-label={`Select ${mode.name} aim trainer mode`}
                      aria-pressed={settings.mode === mode.id}
                      className={`
                        px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${settings.mode === mode.id
                          ? 'bg-[var(--pg-game-error)] text-[var(--pg-text-on-accent)]'
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
                      aria-label={`Set aim trainer duration to ${d} seconds`}
                      aria-pressed={settings.duration === d}
                      className={`
                        px-4 py-2 rounded-lg font-mono text-sm transition-all
                        ${settings.duration === d
                          ? 'bg-[var(--purple)] text-[var(--text-on-accent)]'
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
                  className="pg-range pg-range-purple w-full mt-2"
                  aria-label="Aim sensitivity"
                  aria-valuetext={`${settings.sensitivity.toFixed(1)} sensitivity`}
                />
              </div>

              {/* Best score */}
              {modeScores?.bestScore ? (
                <div className="pg-surface-panel mb-6 inline-flex items-center gap-4 rounded-xl px-4 py-2">
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
                className="px-8 py-3 rounded-lg bg-[var(--pg-game-error)] text-[var(--pg-text-on-accent)] font-medium"
                aria-label="Start aim training"
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
              <div className="pg-overlay-panel px-4 py-2 rounded-lg">
                <div className="text-xs text-[var(--pg-text-muted)]">Score</div>
                <div className="font-mono text-2xl text-[var(--pg-accent-gold)]">{score}</div>
              </div>
              <div className="pg-overlay-panel px-4 py-2 rounded-lg text-center">
                <div className="text-xs text-[var(--pg-text-muted)]">Time</div>
                <div className="font-mono text-2xl text-white">{timeRemaining}</div>
              </div>
              <div className="pg-overlay-panel px-4 py-2 rounded-lg text-right">
                <div className="text-xs text-[var(--pg-text-muted)]">Accuracy</div>
                <div className="font-mono text-2xl text-[var(--pg-game-success)]">{accuracy}%</div>
                <div className="mt-1 text-[10px] text-[var(--pg-text-muted)]">
                  {misses} miss{misses === 1 ? '' : 'es'}
                </div>
              </div>
            </div>

            {/* Re-lock prompt */}
            {showInstructions && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-x-0 bottom-8 flex justify-center px-6"
              >
                <button
                  type="button"
                  onClick={() => document.body.requestPointerLock?.()}
                  className="pg-overlay-panel-strong rounded-xl px-6 py-3 text-center text-white pointer-events-auto"
                  aria-label={hits + misses === 0 ? 'Lock mouse and start aiming' : 'Re-lock mouse and continue aiming'}
                >
                  <p className="font-medium">
                    {hits + misses === 0 ? 'Click to lock mouse and start aiming' : 'Click to re-lock mouse and continue'}
                  </p>
                  <p className="mt-1 text-xs text-white/70">ESC releases the cursor</p>
                </button>
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

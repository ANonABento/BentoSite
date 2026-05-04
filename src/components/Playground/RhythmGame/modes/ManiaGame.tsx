'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Piano, ArrowLeft } from 'lucide-react';
import { GameLayout, ResultsScreen, CountdownOverlay } from '../../shared';
import { useManiaGame } from './ManiaGame.hooks';
import { DIFFICULTY_COLORS } from '../../Playground.config';
import { formatNumber } from '../../Playground.utils';
import {
  MANIA_BEAT_MAPS,
  ManiaBeatMap,
  LANE_COLORS,
  KEY_BINDINGS,
  MANIA_DIMENSIONS,
  COLORS,
} from './ManiaGame.config';
import { useRhythmHighScoreSaver } from './shared';
import { springs } from '../../design';

interface ManiaGameProps {
  onBack: () => void;
}

export function ManiaGame({ onBack }: ManiaGameProps) {
  const [selectedMap, setSelectedMap] = useState<ManiaBeatMap>(MANIA_BEAT_MAPS[0]);

  const {
    status,
    activeNotes,
    score,
    combo,
    perfects,
    greats,
    goods,
    misses,
    result,
    progress,
    pressedKeys,
    keyFlash,
    startGame,
    startPlaying,
    resetGame,
    getCurrentTime,
  } = useManiaGame(selectedMap);

  const { scores, isNewBest, handlePlayAgain } = useRhythmHighScoreSaver(
    'mania',
    selectedMap.id,
    result,
    resetGame
  );

  // Calculate note positions
  const currentTime = status === 'playing' ? getCurrentTime() : 0;

  const laneColors = useMemo(
    () => LANE_COLORS[selectedMap.keyCount],
    [selectedMap.keyCount]
  );
  const keys = useMemo(
    () => KEY_BINDINGS[selectedMap.keyCount],
    [selectedMap.keyCount]
  );

  const showIdle = status === 'idle';
  const showCountdown = status === 'countdown';
  const showGame = status === 'playing';
  const showResults = status === 'finished';

  const totalWidth = selectedMap.keyCount * MANIA_DIMENSIONS.laneWidth;

  return (
    <GameLayout
      title="Mania"
      subtitle={showGame ? `${selectedMap.name} (${selectedMap.keyCount}K)` : undefined}
      headerRight={
        showGame ? (
          <div className="flex items-center gap-4">
            <span className="font-mono text-lg font-semibold text-[var(--pg-accent-primary)]">
              {formatNumber(score)}
            </span>
            {combo > 0 && (
              <>
                <div className="pg-divider" />
                <motion.span
                  key={combo}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="font-mono text-[var(--primary)] font-semibold"
                >
                  {combo}x
                </motion.span>
              </>
            )}
          </div>
        ) : (
          <motion.button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-[var(--pg-text-muted)] hover:text-[var(--pg-text-primary)]"
            whileHover={{ x: -3 }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </motion.button>
        )
      }
    >
      <CountdownOverlay isActive={showCountdown} onComplete={startPlaying} />

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {/* Song selection */}
          {showIdle && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={springs.gentle}
              className="text-center w-full max-w-lg"
            >
              <motion.div
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
                style={{ backgroundColor: 'rgba(224, 123, 60, 0.1)', color: '#e07b3c' }}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={springs.bouncy}
              >
                <Piano className="w-10 h-10" />
              </motion.div>

              <h2 className="text-4xl sm:text-5xl font-bold text-[var(--pg-text-primary)] mb-4 tracking-tight">
                Mania
              </h2>

              <p className="text-[var(--pg-text-secondary)] mb-2 text-lg">
                Falling notes - press keys when they hit the line!
              </p>
              <p className="text-sm text-[var(--pg-text-muted)] mb-8">
                4K: D-F-J-K · 7K: S-D-F-Space-J-K-L
              </p>

              {/* Song list */}
              <div className="space-y-3 mb-10">
                {MANIA_BEAT_MAPS.map((map) => (
                  <motion.button
                    key={map.id}
                    onClick={() => setSelectedMap(map)}
                    className={`
                      w-full p-4 rounded-xl text-left transition-all duration-200
                      ${
                        selectedMap.id === map.id
                          ? 'bg-[var(--primary)]/20 border-[var(--primary)]/40 shadow-lg shadow-[var(--primary)]/10'
                          : 'pg-surface-panel hover:bg-[var(--pg-bg-hover)]'
                      }
                      border
                    `}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--pg-text-primary)]">
                            {map.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.1)] text-xs font-mono">
                            {map.keyCount}K
                          </span>
                        </div>
                        <div className="text-sm text-[var(--pg-text-muted)]">
                          {map.artist} · {map.bpm} BPM · {map.duration}s
                        </div>
                      </div>
                      <div
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize border ${DIFFICULTY_COLORS[map.difficulty]}`}
                      >
                        {map.difficulty}
                      </div>
                    </div>
                    {scores?.[map.id] && (
                      <div className="pg-border-subtle mt-2 flex gap-4 border-t pt-2 text-xs">
                        <span className="text-[var(--pg-text-muted)]">
                          Best: <span className="text-[var(--pg-accent-primary)] font-mono">{formatNumber(scores[map.id].score)}</span>
                        </span>
                        <span className="text-[var(--pg-text-muted)]">
                          Combo: <span className="text-[var(--primary)] font-mono">{scores[map.id].maxCombo}x</span>
                        </span>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>

              <motion.button
                onClick={startGame}
                className="pg-button pg-button-primary text-lg px-10 py-4"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Play
              </motion.button>
            </motion.div>
          )}

          {/* Game playfield */}
          {showGame && (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-4xl"
            >
              {/* Progress bar */}
              <div className="mb-4">
                <div className="pg-progress-track h-1.5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--pg-accent-primary)]"
                    style={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>

              {/* Mania playfield */}
              <div className="flex justify-center">
                <div
                  className="pg-border-subtle relative rounded-xl overflow-hidden border bg-black/50"
                  style={{
                    width: totalWidth + 2,
                    height: 500,
                  }}
                >
                  {/* Lanes */}
                  {Array.from({ length: selectedMap.keyCount }).map((_, lane) => (
                    <div
                      key={lane}
                      className="absolute top-0 bottom-0"
                      style={{
                        left: lane * MANIA_DIMENSIONS.laneWidth,
                        width: MANIA_DIMENSIONS.laneWidth,
                        borderRight: lane < selectedMap.keyCount - 1 ? '1px solid rgba(255,255,255,0.1)' : undefined,
                        backgroundColor: pressedKeys.has(lane) ? `${laneColors[lane]}20` : undefined,
                      }}
                    />
                  ))}

                  {/* Receptor line */}
                  <div
                    className="absolute left-0 right-0 h-1"
                    style={{
                      top: `${MANIA_DIMENSIONS.receptorY * 100}%`,
                      background: `linear-gradient(to right, ${laneColors.join(', ')})`,
                      boxShadow: '0 0 10px rgba(255,255,255,0.5)',
                    }}
                  />

                  {/* Receptors (key indicators) */}
                  {Array.from({ length: selectedMap.keyCount }).map((_, lane) => (
                    <motion.div
                      key={`receptor-${lane}`}
                      className="absolute"
                      style={{
                        left: lane * MANIA_DIMENSIONS.laneWidth + 5,
                        top: `calc(${MANIA_DIMENSIONS.receptorY * 100}% - 15px)`,
                        width: MANIA_DIMENSIONS.laneWidth - 10,
                        height: 30,
                        borderRadius: 4,
                        border: `2px solid ${laneColors[lane]}`,
                        backgroundColor: pressedKeys.has(lane) ? laneColors[lane] : 'transparent',
                        boxShadow: pressedKeys.has(lane) ? `0 0 15px ${laneColors[lane]}` : undefined,
                      }}
                      animate={{
                        scale: keyFlash.includes(lane) ? [1, 1.1, 1] : 1,
                      }}
                      transition={{ duration: 0.1 }}
                    />
                  ))}

                  {/* Notes */}
                  {activeNotes.map((note) => {
                    const timeDiff = note.time - currentTime;
                    const yPosition =
                      MANIA_DIMENSIONS.receptorY -
                      (timeDiff / MANIA_DIMENSIONS.approachTime) * MANIA_DIMENSIONS.receptorY;

                    if (note.hit && note.rating !== 'miss') return null;

                    return (
                      <motion.div
                        key={note.id}
                        className="absolute rounded"
                        style={{
                          left: note.lane * MANIA_DIMENSIONS.laneWidth + 5,
                          top: `${yPosition * 100}%`,
                          width: MANIA_DIMENSIONS.laneWidth - 10,
                          height: note.holdDuration
                            ? (note.holdDuration / MANIA_DIMENSIONS.approachTime) * MANIA_DIMENSIONS.receptorY * 500
                            : MANIA_DIMENSIONS.noteHeight,
                          backgroundColor: note.hit ? COLORS.miss : laneColors[note.lane],
                          boxShadow: note.hit ? undefined : `0 0 10px ${laneColors[note.lane]}80`,
                          opacity: note.hit ? 0.3 : 1,
                        }}
                        initial={note.hit ? { scale: 1 } : false}
                        animate={note.hit ? { scale: 0, opacity: 0 } : {}}
                        transition={{ duration: 0.2 }}
                      />
                    );
                  })}

                  {/* Combo display */}
                  {combo >= 5 && (
                    <motion.div
                      className="absolute left-1/2 -translate-x-1/2"
                      style={{ top: '40%' }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      key={Math.floor(combo / 5)}
                    >
                      <span
                        className="font-mono text-4xl font-bold text-[var(--primary)]"
                        style={{ textShadow: '0 0 20px rgba(224, 123, 60, 0.8)' }}
                      >
                        {combo}x
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Key indicators */}
              <div className="flex justify-center gap-1 mt-4">
                {keys.map((key, lane) => (
                  <div
                    key={lane}
                    className="w-12 h-10 rounded flex items-center justify-center text-sm font-mono font-bold"
                    style={{
                      backgroundColor: pressedKeys.has(lane) ? laneColors[lane] : `${laneColors[lane]}30`,
                      color: pressedKeys.has(lane) ? 'white' : laneColors[lane],
                    }}
                  >
                    {key.toUpperCase()}
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="flex justify-center gap-4 mt-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.perfect }} />
                  <span className="text-[var(--pg-text-secondary)]">Perfect</span>
                  <span className="font-mono" style={{ color: COLORS.perfect }}>{perfects}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.great }} />
                  <span className="text-[var(--pg-text-secondary)]">Great</span>
                  <span className="font-mono" style={{ color: COLORS.great }}>{greats}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.good }} />
                  <span className="text-[var(--pg-text-secondary)]">Good</span>
                  <span className="font-mono" style={{ color: COLORS.good }}>{goods}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.miss }} />
                  <span className="text-[var(--pg-text-secondary)]">Miss</span>
                  <span className="font-mono" style={{ color: COLORS.miss }}>{misses}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Results */}
          {showResults && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ResultsScreen
                title={`${selectedMap.name} (${selectedMap.keyCount}K)`}
                isNewHighScore={isNewBest ?? false}
                onPlayAgain={handlePlayAgain}
                primaryStatIndex={0}
                stats={[
                  { label: 'Score', value: formatNumber(result.score), highlight: true },
                  { label: 'Max Combo', value: `${result.maxCombo}x` },
                  { label: 'Accuracy', value: `${result.accuracy}%` },
                  { label: 'Perfect', value: result.perfects },
                ]}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameLayout>
  );
}

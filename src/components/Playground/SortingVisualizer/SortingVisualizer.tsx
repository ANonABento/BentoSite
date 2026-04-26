'use client';

import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Shuffle, BarChart3 } from 'lucide-react';
import { GameLayout } from '../shared';
import { useSortingVisualizer } from './SortingVisualizer.hooks';
import { SortingAlgorithm } from './SortingVisualizer.types';
import { useIsMobile } from '../Playground.hooks';
import {
  ALGORITHMS,
  COLORS,
  MIN_ARRAY_SIZE,
  MAX_ARRAY_SIZE,
  MIN_SPEED,
  MAX_SPEED,
} from './SortingVisualizer.config';
import { springs } from '../design';

export function SortingVisualizer() {
  const isMobile = useIsMobile();

  const {
    array,
    status,
    algorithm,
    speed,
    arraySize,
    comparing,
    swapping,
    sorted,
    pivot,
    comparisons,
    swaps,
    setAlgorithm,
    setSpeed,
    setArraySize,
    generateArray,
    start,
    pause,
    resume,
    reset,
  } = useSortingVisualizer();

  const currentAlgorithm = ALGORITHMS.find((a) => a.id === algorithm);
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle';
  const isFinished = status === 'finished';

  const getBarColor = (index: number) => {
    if (sorted.has(index)) return COLORS.sorted;
    if (swapping.includes(index)) return COLORS.swapping;
    if (comparing.includes(index)) return COLORS.comparing;
    if (pivot === index) return COLORS.pivot;
    return COLORS.default;
  };

  const maxValue = Math.max(...array);
  const barWidth = Math.max(2, Math.floor((isMobile ? 300 : 600) / array.length) - 1);

  return (
    <GameLayout
      title="Sorting Visualizer"
      subtitle={currentAlgorithm?.name}
      headerRight={
        isRunning || isPaused ? (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[var(--pg-text-muted)]">
              Comparisons: <span className="font-mono text-[var(--pg-accent-gold)]">{comparisons}</span>
            </span>
            <span className="text-[var(--pg-text-muted)]">
              Swaps: <span className="font-mono text-[var(--pg-game-error)]">{swaps}</span>
            </span>
          </div>
        ) : null
      }
    >
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.gentle}
          className="text-center mb-6"
        >
          <motion.div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--purple)]/10 text-[var(--purple)] mb-3"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={springs.bouncy}
          >
            <BarChart3 className="w-7 h-7" />
          </motion.div>

          <h2 className="text-2xl font-bold text-[var(--pg-text-primary)] mb-1">
            Sorting Visualizer
          </h2>
          <p className="text-sm text-[var(--pg-text-secondary)]">
            Watch sorting algorithms in action
          </p>
        </motion.div>

        {/* Algorithm selector */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {ALGORITHMS.map((algo) => (
            <motion.button
              key={algo.id}
              onClick={() => !isRunning && setAlgorithm(algo.id as SortingAlgorithm)}
              disabled={isRunning}
              aria-label={`Select ${algo.name} sorting algorithm`}
              aria-pressed={algorithm === algo.id}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${algorithm === algo.id
                  ? 'bg-[var(--purple)] text-[var(--text-on-accent)]'
                  : 'bg-[var(--pg-bg-elevated)] text-[var(--pg-text-secondary)] hover:bg-[var(--pg-bg-hover)]'
                }
                ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              whileHover={!isRunning ? { scale: 1.02 } : {}}
              whileTap={!isRunning ? { scale: 0.98 } : {}}
            >
              {algo.name}
            </motion.button>
          ))}
        </div>

        {/* Algorithm info */}
        {currentAlgorithm && (
          <div className="text-center mb-4">
            <span className="text-xs text-[var(--pg-text-muted)]">
              Time: <span className="font-mono text-[var(--pg-accent-gold)]">{currentAlgorithm.timeComplexity}</span>
              {' · '}
              Space: <span className="font-mono text-[var(--pg-text-secondary)]">{currentAlgorithm.spaceComplexity}</span>
            </span>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4 mb-6">
          {/* Array size slider */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--pg-text-muted)]">Size</span>
            <input
              type="range"
              min={MIN_ARRAY_SIZE}
              max={MAX_ARRAY_SIZE}
              value={arraySize}
              onChange={(e) => setArraySize(parseInt(e.target.value))}
              disabled={isRunning || isPaused}
              className="pg-range pg-range-purple w-20 disabled:opacity-50"
              aria-label="Array size"
            />
            <span className="text-xs font-mono text-[var(--pg-text-secondary)] w-8">{arraySize}</span>
          </div>

          {/* Speed slider */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--pg-text-muted)]">Speed</span>
            <input
              type="range"
              min={MIN_SPEED}
              max={MAX_SPEED}
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              className="pg-range w-20"
              aria-label="Sorting speed"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 mb-6">
          <motion.button
            onClick={generateArray}
            disabled={isRunning}
            aria-label="Shuffle array"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--pg-bg-elevated)] text-[var(--pg-text-secondary)] hover:bg-[var(--pg-bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={!isRunning ? { scale: 1.02 } : {}}
            whileTap={!isRunning ? { scale: 0.98 } : {}}
          >
            <Shuffle className="w-4 h-4" />
            <span className="text-sm">Shuffle</span>
          </motion.button>

          {isIdle || isFinished ? (
            <motion.button
              onClick={start}
              aria-label={`Start ${currentAlgorithm?.name ?? 'selected'} sort`}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[var(--purple)] text-[var(--text-on-accent)] font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play className="w-4 h-4" />
              <span className="text-sm">Sort</span>
            </motion.button>
          ) : isRunning ? (
            <motion.button
              onClick={pause}
              aria-label="Pause sorting visualization"
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[var(--pg-accent-gold)] text-black font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Pause className="w-4 h-4" />
              <span className="text-sm">Pause</span>
            </motion.button>
          ) : (
            <motion.button
              onClick={resume}
              aria-label="Resume sorting visualization"
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[var(--purple)] text-[var(--text-on-accent)] font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play className="w-4 h-4" />
              <span className="text-sm">Resume</span>
            </motion.button>
          )}

          <motion.button
            onClick={reset}
            aria-label="Reset sorting visualization"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--pg-bg-elevated)] text-[var(--pg-text-secondary)] hover:bg-[var(--pg-bg-hover)]"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm">Reset</span>
          </motion.button>
        </div>

        {/* Visualization */}
        <div
          className="pg-surface-frame flex items-end justify-center gap-px rounded-xl p-4"
          style={{ minHeight: isMobile ? 200 : 300 }}
          role="img"
          aria-label={`${currentAlgorithm?.name ?? 'Sorting'} visualization with ${arraySize} bars, ${comparisons} comparisons, and ${swaps} swaps.`}
        >
          {array.map((value, index) => (
            <motion.div
              key={index}
              className="rounded-t-sm"
              style={{
                width: barWidth,
                height: `${(value / maxValue) * (isMobile ? 150 : 250)}px`,
                backgroundColor: getBarColor(index),
                transition: 'background-color 0.1s',
              }}
              initial={{ height: 0 }}
              animate={{ height: `${(value / maxValue) * (isMobile ? 150 : 250)}px` }}
              transition={{ duration: 0.05 }}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.default }} />
            <span className="text-xs text-[var(--pg-text-muted)]">Unsorted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.comparing }} />
            <span className="text-xs text-[var(--pg-text-muted)]">Comparing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.swapping }} />
            <span className="text-xs text-[var(--pg-text-muted)]">Swapping</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.sorted }} />
            <span className="text-xs text-[var(--pg-text-muted)]">Sorted</span>
          </div>
        </div>

        {/* Stats when finished */}
        {isFinished && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center"
          >
            <div className="pg-surface-panel inline-flex items-center gap-6 rounded-xl px-6 py-3">
              <div>
                <div className="text-xs text-[var(--pg-text-muted)]">Comparisons</div>
                <div className="font-mono text-lg text-[var(--pg-accent-gold)]">{comparisons}</div>
              </div>
              <div className="pg-divider-tall" />
              <div>
                <div className="text-xs text-[var(--pg-text-muted)]">Swaps</div>
                <div className="font-mono text-lg text-[var(--pg-game-error)]">{swaps}</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </GameLayout>
  );
}

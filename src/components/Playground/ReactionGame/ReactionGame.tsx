'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useMemo } from 'react';
import { Zap } from 'lucide-react';
import { GameLayout, ResultsScreen, CountdownOverlay } from '../shared';
import { useReactionGame } from './ReactionGame.hooks';
import { useHighScores } from '../Playground.hooks';
import {
  formatReactionTime,
  getReactionRating,
  isNewHighScore,
} from '../Playground.utils';
import { REACTION_CONFIG } from '../Playground.config';
import { popIn, springs } from '../design';

export function ReactionGame() {
  const {
    status,
    round,
    phase,
    rounds,
    startGame,
    startPlaying,
    handleClick,
    resetGame,
  } = useReactionGame();

  const { scores, saveScore } = useHighScores('reaction');

  const isFinished = status === 'finished';

  // Calculate results
  const validRounds = rounds.filter((r) => r.reactionTime > 0);
  const average = useMemo(() => {
    if (validRounds.length === 0) return 0;
    return Math.round(
      validRounds.reduce((sum, r) => sum + r.reactionTime, 0) / validRounds.length
    );
  }, [validRounds]);

  const best = validRounds.length > 0 ? Math.min(...validRounds.map((r) => r.reactionTime)) : 0;
  const worst = validRounds.length > 0 ? Math.max(...validRounds.map((r) => r.reactionTime)) : 0;
  const tooEarlyCount = rounds.filter((r) => r.reactionTime < 0).length;

  // Check for new high score
  const isNewBest = isFinished && isNewHighScore(average, scores?.best, true);

  // Save score when game finishes
  const handleFinish = useCallback(() => {
    if (average > 0) {
      const history = scores?.history ?? [];
      saveScore({
        best: scores?.best ? Math.min(scores.best, average) : average,
        history: [average, ...history].slice(0, 10),
      });
    }
  }, [average, scores, saveScore]);

  const handlePlayAgain = useCallback(() => {
    if (isNewBest && average > 0) {
      handleFinish();
    }
    resetGame();
  }, [isNewBest, average, handleFinish, resetGame]);

  // Determine what to show
  const showIdle = status === 'idle';
  const showCountdown = status === 'countdown';
  const showGame = status === 'playing';
  const showResults = status === 'finished';

  // Last round result for feedback
  const lastRound = rounds[rounds.length - 1];

  // Phase-based styles
  const phaseStyles = {
    waiting: {
      bg: 'bg-gradient-to-br from-red-500 to-red-700',
      glow: 'shadow-[0_0_60px_rgba(239,68,68,0.3)]',
    },
    ready: {
      bg: 'bg-gradient-to-br from-green-400 to-green-600',
      glow: 'shadow-[0_0_80px_rgba(74,222,128,0.4)]',
    },
    tooEarly: {
      bg: 'bg-gradient-to-br from-amber-400 to-amber-600',
      glow: 'shadow-[0_0_60px_rgba(251,191,36,0.3)]',
    },
    clicked: {
      bg: 'bg-gradient-to-br from-[var(--purple)] to-[var(--purple-active)]',
      glow: 'shadow-[0_0_60px_rgba(167,139,250,0.3)]',
    },
  };

  const currentPhaseStyle = phaseStyles[phase] || phaseStyles.waiting;

  return (
    <GameLayout
      title="Reaction Time"
      subtitle={showGame ? `Round ${round}/${REACTION_CONFIG.totalRounds}` : undefined}
      headerRight={
        showGame && validRounds.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="pg-label">Avg</span>
            <span className="font-mono text-sm text-[var(--pg-accent-gold)]">
              {average}ms
            </span>
          </div>
        ) : null
      }
    >
      {/* Countdown overlay */}
      <CountdownOverlay isActive={showCountdown} onComplete={startPlaying} />

      {/* Game area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {/* Idle state */}
          {showIdle && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={springs.gentle}
              className="text-center max-w-lg"
            >
              {/* Icon */}
              <motion.div
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[var(--pg-accent-gold)]/10 text-[var(--pg-accent-gold)] mb-6"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={springs.bouncy}
              >
                <Zap className="w-10 h-10" />
              </motion.div>

              <h2 className="text-4xl sm:text-5xl font-bold text-[var(--pg-text-primary)] mb-4 tracking-tight">
                Reaction Time
              </h2>

              <p className="text-[var(--pg-text-secondary)] mb-8 text-lg leading-relaxed">
                When the box turns{' '}
                <span className="text-[var(--pg-game-success)] font-medium">green</span>,
                click as quickly as you can.
                <br />
                <span className="text-[var(--pg-text-muted)]">
                  {REACTION_CONFIG.totalRounds} rounds to determine your average.
                </span>
              </p>

              {/* Best score if exists */}
              {scores?.best && (
                <motion.div
                  className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--pg-bg-elevated)] border border-white/[0.06]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="pg-label">Your Best</span>
                  <span className="font-mono font-semibold text-[var(--pg-accent-gold)]">
                    {scores.best}ms
                  </span>
                </motion.div>
              )}

              <motion.button
                onClick={startGame}
                className="pg-button pg-button-primary text-lg px-10 py-4"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Test
              </motion.button>
            </motion.div>
          )}

          {/* Game state */}
          {showGame && (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-2xl"
            >
              {/* Click zone */}
              <motion.button
                onClick={handleClick}
                className={`
                  w-full aspect-[4/3] rounded-3xl
                  flex flex-col items-center justify-center
                  cursor-pointer select-none
                  transition-all duration-150
                  ${currentPhaseStyle.bg}
                  ${currentPhaseStyle.glow}
                  relative overflow-hidden
                `}
                whileTap={{ scale: 0.98 }}
              >
                {/* Subtle grid pattern */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                  }}
                />

                {/* Content */}
                <div className="relative z-10 text-center">
                  {phase === 'waiting' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <span className="text-3xl sm:text-4xl font-bold text-white/90">
                        Wait for green...
                      </span>
                    </motion.div>
                  )}

                  {phase === 'ready' && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={springs.bouncy}
                    >
                      <span className="text-5xl sm:text-6xl font-bold text-white">
                        CLICK!
                      </span>
                    </motion.div>
                  )}

                  {phase === 'tooEarly' && (
                    <motion.div
                      initial={{ x: -10 }}
                      animate={{ x: [0, -5, 5, -5, 5, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      <span className="text-2xl sm:text-3xl font-bold text-white/90">
                        Too early!
                      </span>
                      <span className="block mt-2 text-white/70 text-lg">
                        Click to continue
                      </span>
                    </motion.div>
                  )}

                  {phase === 'clicked' && lastRound && (
                    <motion.div
                      variants={popIn}
                      initial="hidden"
                      animate="visible"
                      className="text-center"
                    >
                      <span className="text-6xl sm:text-7xl font-bold text-white font-mono">
                        {lastRound.reactionTime}
                      </span>
                      <span className="text-2xl sm:text-3xl font-bold text-white/80 ml-1">
                        ms
                      </span>
                      <span className="block mt-2 text-white/60 text-lg capitalize">
                        {getReactionRating(lastRound.reactionTime)}
                      </span>
                    </motion.div>
                  )}
                </div>
              </motion.button>

              {/* Round indicators */}
              <div className="flex justify-center gap-3 mt-8">
                {Array.from({ length: REACTION_CONFIG.totalRounds }).map((_, i) => {
                  const roundData = rounds[i];
                  const isComplete = roundData !== undefined;
                  const isCurrent = i === round - 1 && !isComplete;

                  let bgColor = 'bg-white/10';
                  if (isComplete) {
                    if (roundData.reactionTime < 0) {
                      bgColor = 'bg-amber-400';
                    } else if (roundData.reactionTime < 250) {
                      bgColor = 'bg-[var(--pg-game-success)]';
                    } else if (roundData.reactionTime < 350) {
                      bgColor = 'bg-[var(--purple)]';
                    } else {
                      bgColor = 'bg-[var(--pg-accent-gold)]';
                    }
                  }

                  return (
                    <motion.div
                      key={i}
                      className={`
                        w-3 h-3 rounded-full transition-all duration-200
                        ${bgColor}
                        ${isCurrent ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-[var(--pg-bg-deep)]' : ''}
                      `}
                      initial={isComplete ? { scale: 0 } : false}
                      animate={isComplete ? { scale: 1 } : false}
                      transition={springs.bouncy}
                      title={
                        isComplete
                          ? formatReactionTime(roundData.reactionTime)
                          : `Round ${i + 1}`
                      }
                    />
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Results */}
          {showResults && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ResultsScreen
                title="Reaction Time"
                isNewHighScore={isNewBest}
                onPlayAgain={handlePlayAgain}
                primaryStatIndex={0}
                stats={[
                  { label: 'Average', value: `${average}ms`, highlight: true },
                  { label: 'Best', value: `${best}ms` },
                  { label: 'Worst', value: `${worst}ms` },
                  { label: 'Too Early', value: tooEarlyCount },
                ]}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameLayout>
  );
}

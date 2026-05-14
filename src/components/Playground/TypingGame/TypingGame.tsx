'use client';

import { AnimatePresence, m } from 'framer-motion';
import { useState, useCallback } from 'react';
import { Keyboard } from 'lucide-react';
import { GameLayout, ResultsScreen, CountdownOverlay } from '../shared';
import { useTypingGame } from './TypingGame.hooks';
import { WordDisplay } from './WordDisplay';
import { useHighScores } from '../Playground.hooks';
import { TypingDifficulty, TypingDuration } from '../Playground.types';
import { isNewHighScore } from '../Playground.utils';
import { TYPING_CONFIG } from '../Playground.config';
import { springs } from '../design';

export function TypingGame() {
  const [duration, setDuration] = useState<TypingDuration>(60);
  const [difficulty, setDifficulty] = useState<TypingDifficulty>('medium');

  const {
    status,
    text,
    currentIndex,
    errorIndices,
    formattedTime,
    liveWPM,
    liveAccuracy,
    result,
    inputRef,
    startGame,
    startPlaying,
    handleKeyDown,
    resetGame,
  } = useTypingGame(duration, difficulty);

  const { scores, saveScore } = useHighScores('typing');

  const isFinished = status === 'finished';
  const isNewBest = isFinished && result && isNewHighScore(result.wpm, scores?.bestWPM);

  // Save score when finished
  const handlePlayAgain = useCallback(() => {
    if (result && result.wpm > 0) {
      const history = scores?.history ?? [];
      saveScore({
        bestWPM: scores?.bestWPM ? Math.max(scores.bestWPM, result.wpm) : result.wpm,
        bestAccuracy: scores?.bestAccuracy
          ? Math.max(scores.bestAccuracy, result.accuracy)
          : result.accuracy,
        history: [result, ...history].slice(0, 10),
      });
    }
    resetGame();
  }, [result, scores, saveScore, resetGame]);

  const showIdle = status === 'idle';
  const showCountdown = status === 'countdown';
  const showGame = status === 'playing';
  const showResults = status === 'finished';

  return (
    <GameLayout
      title="Typing Speed"
      subtitle={showGame ? `${duration}s · ${difficulty}` : undefined}
      headerRight={
        showGame ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="pg-label">WPM</span>
              <span className="font-mono font-semibold text-[var(--purple)]">{liveWPM}</span>
            </div>
            <div className="pg-divider" />
            <span className="font-mono text-[var(--pg-accent-gold)]">{formattedTime}</span>
          </div>
        ) : null
      }
    >
      {/* Countdown overlay */}
      <CountdownOverlay isActive={showCountdown} onComplete={startPlaying} />

      {/* Hidden input for capturing keystrokes */}
      <input
        ref={inputRef}
        type="text"
        className="sr-only"
        onKeyDown={handleKeyDown}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Typing test input"
      />

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {/* Idle state - Settings */}
          {showIdle && (
            <m.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={springs.gentle}
              className="text-center w-full max-w-lg"
            >
              {/* Icon */}
              <m.div
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[var(--purple)]/10 text-[var(--purple)] mb-6"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={springs.bouncy}
              >
                <Keyboard className="w-10 h-10" />
              </m.div>

              <h2 className="text-4xl sm:text-5xl font-bold text-[var(--pg-text-primary)] mb-4 tracking-tight">
                Typing Speed
              </h2>

              <p className="text-[var(--pg-text-secondary)] mb-10 text-lg">
                Type the text as fast and accurately as you can.
              </p>

              {/* Duration selector */}
              <div className="mb-6">
                <span className="pg-label block mb-3">Duration</span>
                <div className="flex gap-2 justify-center">
                  {TYPING_CONFIG.durations.map((d) => (
                    <m.button
                      key={d}
                      onClick={() => setDuration(d)}
                      aria-label={`Set typing test duration to ${d} seconds`}
                      aria-pressed={duration === d}
                      className={`
                        px-5 py-2.5 rounded-xl font-mono font-medium transition-all duration-200
                        ${
                          duration === d
                            ? 'bg-[var(--purple)] text-[var(--text-on-accent)] shadow-lg shadow-[var(--purple)]/25'
                            : 'pg-surface-panel text-[var(--pg-text-secondary)] hover:bg-[var(--pg-bg-hover)]'
                        }
                      `}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {d}s
                    </m.button>
                  ))}
                </div>
              </div>

              {/* Difficulty selector */}
              <div className="mb-10">
                <span className="pg-label block mb-3">Difficulty</span>
                <div className="flex gap-2 justify-center">
                  {TYPING_CONFIG.difficulties.map((d) => (
                    <m.button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      aria-label={`Set typing difficulty to ${d}`}
                      aria-pressed={difficulty === d}
                      className={`
                        px-5 py-2.5 rounded-xl font-medium capitalize transition-all duration-200
                        ${
                          difficulty === d
                            ? 'bg-[var(--purple)] text-[var(--text-on-accent)] shadow-lg shadow-[var(--purple)]/25'
                            : 'pg-surface-panel text-[var(--pg-text-secondary)] hover:bg-[var(--pg-bg-hover)]'
                        }
                      `}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {d}
                    </m.button>
                  ))}
                </div>
              </div>

              {/* Best score if exists */}
              {scores?.bestWPM && (
                <m.div
                  className="pg-surface-panel mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="pg-label">Your Best</span>
                  <span className="font-mono font-semibold text-[var(--purple)]">
                    {scores.bestWPM} WPM
                  </span>
                </m.div>
              )}

              <m.button
                onClick={startGame}
                className="pg-button pg-button-primary text-lg px-10 py-4"
                aria-label="Start typing speed test"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Test
              </m.button>
            </m.div>
          )}

          {/* Game state */}
          {showGame && (
            <m.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-4xl"
              onClick={() => inputRef.current?.focus()}
              role="application"
              aria-label="Typing test. Type the displayed words using the keyboard."
              tabIndex={0}
            >
              {/* Stats bar */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex gap-8">
                  <div className="text-center">
                    <span className="pg-label block mb-1">WPM</span>
                    <div className="pg-score-medium font-mono text-[var(--purple)]">
                      {liveWPM}
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="pg-label block mb-1">Accuracy</span>
                    <div className="pg-score-medium font-mono text-[var(--pg-text-primary)]">
                      {liveAccuracy}%
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <span className="pg-label block mb-1">Time</span>
                  <div className="pg-score-medium font-mono text-[var(--pg-accent-gold)]">
                    {formattedTime}
                  </div>
                </div>
              </div>

              {/* Word display */}
              <div className="pg-card p-6 sm:p-8">
                <WordDisplay
                  text={text}
                  currentIndex={currentIndex}
                  errorIndices={errorIndices}
                />
              </div>

              {/* Help text */}
              <m.p
                className="text-center text-[var(--pg-text-muted)] text-sm mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Click anywhere and start typing
              </m.p>
            </m.div>
          )}

          {/* Results */}
          {showResults && result && (
            <m.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ResultsScreen
                title="Typing Speed"
                isNewHighScore={isNewBest ?? false}
                onPlayAgain={handlePlayAgain}
                primaryStatIndex={0}
                stats={[
                  { label: 'WPM', value: result.wpm, highlight: true },
                  { label: 'Accuracy', value: `${result.accuracy}%` },
                  { label: 'Characters', value: result.totalChars },
                  { label: 'Correct', value: result.correctChars },
                ]}
              />
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </GameLayout>
  );
}

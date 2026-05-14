'use client';

import { AnimatePresence, m } from 'framer-motion';
import { useState, useCallback, useRef } from 'react';
import { Drum, ArrowLeft } from 'lucide-react';
import { GameLayout, ResultsScreen, CountdownOverlay } from '../../shared';
import { useTaikoGame } from './TaikoGame.hooks';
import { DIFFICULTY_COLORS } from '../../Playground.config';
import { formatNumber } from '../../Playground.utils';
import {
  TAIKO_BEAT_MAPS,
  TaikoBeatMap,
  TaikoNoteType,
  COLORS,
  TAIKO_DIMENSIONS,
} from './TaikoGame.config';
import { useRhythmHighScoreSaver } from './shared';
import { springs } from '../../design';

interface TaikoNoteProps {
  noteType: TaikoNoteType;
  large?: boolean;
  position: number; // 0-1, where hitZoneX is the target
  hit: boolean;
  rating?: 'perfect' | 'good' | 'miss';
}

function TaikoNoteComponent({ noteType, large, position, hit, rating }: TaikoNoteProps) {
  const size = large ? TAIKO_DIMENSIONS.largeNoteSize : TAIKO_DIMENSIONS.noteSize;
  const color = noteType === 'don'
    ? (large ? COLORS.donLarge : COLORS.don)
    : (large ? COLORS.katLarge : COLORS.kat);

  if (hit) {
    if (rating === 'miss') {
      return (
        <m.div
          className="absolute"
          style={{
            left: `${position * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: size,
            height: size,
          }}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="w-full h-full rounded-full border-2"
            style={{ borderColor: COLORS.miss, opacity: 0.5 }}
          />
        </m.div>
      );
    }

    // Hit effect
    return (
      <m.div
        className="absolute"
        style={{
          left: `${TAIKO_DIMENSIONS.hitZoneX * 100}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className="rounded-full"
          style={{
            width: size,
            height: size,
            backgroundColor: rating === 'perfect' ? COLORS.perfect : COLORS.good,
          }}
        />
      </m.div>
    );
  }

  return (
    <div
      className="absolute"
      style={{
        left: `${position * 100}%`,
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: size,
        height: size,
      }}
    >
      <div
        className="w-full h-full rounded-full flex items-center justify-center"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 20px ${color}80`,
        }}
      >
        {/* Inner circle for Don (center) */}
        {noteType === 'don' && (
          <div
            className="w-1/2 h-1/2 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
          />
        )}
        {/* Ring for Kat (rim) */}
        {noteType === 'kat' && (
          <div
            className="w-3/4 h-3/4 rounded-full border-4"
            style={{ borderColor: 'rgba(255,255,255,0.3)' }}
          />
        )}
      </div>
    </div>
  );
}

interface DrumProps {
  lastHitType: TaikoNoteType | null;
  lastHitRating: 'perfect' | 'good' | 'miss' | null;
  hitEffectVersion: number;
}

function DrumDisplay({ lastHitType, lastHitRating, hitEffectVersion }: DrumProps) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Drum body */}
      <div className="relative">
        {/* Outer rim */}
        <m.div
          className="w-32 h-32 rounded-full border-8 flex items-center justify-center"
          style={{
            borderColor: lastHitType === 'kat' && lastHitRating !== 'miss' ? COLORS.kat : '#333',
            backgroundColor: '#1a1a2e',
          }}
          animate={{
            scale: lastHitType === 'kat' ? [1, 1.1, 1] : 1,
          }}
          transition={{ duration: 0.1 }}
        >
          {/* Inner drum */}
          <m.div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: lastHitType === 'don' && lastHitRating !== 'miss' ? COLORS.don : '#ee553380',
            }}
            animate={{
              scale: lastHitType === 'don' ? [1, 1.15, 1] : 1,
            }}
            transition={{ duration: 0.1 }}
          >
            <Drum className="w-8 h-8 text-white/60" />
          </m.div>
        </m.div>

        {/* Hit feedback */}
        {lastHitRating && lastHitRating !== 'miss' && (
          <m.div
            key={hitEffectVersion}
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="w-32 h-32 rounded-full"
              style={{
                backgroundColor: lastHitRating === 'perfect' ? COLORS.perfect : COLORS.good,
                opacity: 0.3,
              }}
            />
          </m.div>
        )}
      </div>
    </div>
  );
}

interface TaikoGameProps {
  onBack: () => void;
}

export function TaikoGame({ onBack }: TaikoGameProps) {
  const [selectedMap, setSelectedMap] = useState<TaikoBeatMap>(TAIKO_BEAT_MAPS[0]);

  const {
    status,
    activeNotes,
    score,
    combo,
    perfects,
    goods,
    misses,
    result,
    progress,
    lastHitType,
    lastHitRating,
    hitEffectVersion,
    startGame,
    startPlaying,
    handleHit,
    resetGame,
    getCurrentTime,
  } = useTaikoGame(selectedMap);

  const { scores, isNewBest, handlePlayAgain } = useRhythmHighScoreSaver(
    'taiko',
    selectedMap.id,
    result,
    resetGame
  );
  const playfieldRef = useRef<HTMLDivElement>(null);

  // Calculate note positions
  const currentTime = status === 'playing' ? getCurrentTime() : 0;

  // Touch controls for mobile
  const handleTouchDon = useCallback(() => handleHit('don'), [handleHit]);
  const handleTouchKat = useCallback(() => handleHit('kat'), [handleHit]);

  const showIdle = status === 'idle';
  const showCountdown = status === 'countdown';
  const showGame = status === 'playing';
  const showResults = status === 'finished';

  return (
    <GameLayout
      title="Taiko"
      subtitle={showGame ? selectedMap.name : undefined}
      headerRight={
        showGame ? (
          <div className="flex items-center gap-4">
            <span className="font-mono text-lg font-semibold text-[var(--pg-accent-gold)]">
              {formatNumber(score)}
            </span>
            {combo > 0 && (
              <>
                <div className="pg-divider" />
                <m.span
                  key={combo}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="font-mono text-[var(--purple)] font-semibold"
                >
                  {combo}x
                </m.span>
              </>
            )}
          </div>
        ) : (
          <m.button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-[var(--pg-text-muted)] hover:text-[var(--pg-text-primary)]"
            whileHover={{ x: -3 }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </m.button>
        )
      }
    >
      <CountdownOverlay isActive={showCountdown} onComplete={startPlaying} />

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {/* Song selection */}
          {showIdle && (
            <m.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={springs.gentle}
              className="text-center w-full max-w-lg"
            >
              <m.div
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
                style={{ backgroundColor: `${COLORS.don}20`, color: COLORS.don }}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={springs.bouncy}
              >
                <Drum className="w-10 h-10" />
              </m.div>

              <h2 className="text-4xl sm:text-5xl font-bold text-[var(--pg-text-primary)] mb-4 tracking-tight">
                Taiko
              </h2>

              <p className="text-[var(--pg-text-secondary)] mb-2 text-lg">
                Hit the drum when notes reach the target!
              </p>
              <p className="text-sm text-[var(--pg-text-muted)] mb-8">
                <span style={{ color: COLORS.don }}>D/F</span> for center (Don) ·{' '}
                <span style={{ color: COLORS.kat }}>J/K</span> for rim (Kat)
              </p>

              {/* Song list */}
              <div className="space-y-3 mb-10">
                {TAIKO_BEAT_MAPS.map((map) => (
                  <m.button
                    key={map.id}
                    onClick={() => setSelectedMap(map)}
                    className={`
                      w-full p-4 rounded-xl text-left transition-all duration-200
                      ${
                        selectedMap.id === map.id
                          ? 'bg-[var(--pg-accent-gold)]/10 border-[var(--pg-accent-gold)]/40 shadow-lg shadow-[var(--pg-accent-gold)]/10'
                          : 'pg-surface-panel hover:bg-[var(--pg-bg-hover)]'
                      }
                      border
                    `}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-[var(--pg-text-primary)] mb-0.5">
                          {map.name}
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
                          Best: <span className="text-[var(--pg-accent-gold)] font-mono">{formatNumber(scores[map.id].score)}</span>
                        </span>
                        <span className="text-[var(--pg-text-muted)]">
                          Combo: <span className="text-[var(--purple)] font-mono">{scores[map.id].maxCombo}x</span>
                        </span>
                      </div>
                    )}
                  </m.button>
                ))}
              </div>

              <m.button
                onClick={startGame}
                className="pg-button pg-button-primary text-lg px-10 py-4"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Play
              </m.button>
            </m.div>
          )}

          {/* Game playfield */}
          {showGame && (
            <m.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-4xl"
            >
              {/* Progress bar */}
              <div className="mb-4">
                <div className="pg-progress-track h-1.5 rounded-full overflow-hidden">
                  <m.div
                    className="h-full"
                    style={{
                      background: `linear-gradient(to right, ${COLORS.don}, ${COLORS.kat})`,
                      width: `${progress * 100}%`
                    }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>

              {/* Taiko playfield */}
              <div
                ref={playfieldRef}
                className="pg-surface-frame relative w-full h-40 rounded-2xl overflow-hidden"
              >
                {/* Hit zone indicator */}
                <div
                  className="absolute top-0 bottom-0 w-1"
                  style={{
                    left: `${TAIKO_DIMENSIONS.hitZoneX * 100}%`,
                    background: `linear-gradient(to bottom, ${COLORS.don}, ${COLORS.kat})`,
                    boxShadow: `0 0 20px ${COLORS.don}80`,
                  }}
                />

                {/* Hit zone circle */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-4 border-white/20"
                  style={{ left: `calc(${TAIKO_DIMENSIONS.hitZoneX * 100}% - 40px)` }}
                />

                {/* Notes */}
                {activeNotes.map((note) => {
                  const timeDiff = note.time - currentTime;
                  const position =
                    TAIKO_DIMENSIONS.hitZoneX +
                    (timeDiff / TAIKO_DIMENSIONS.approachTime) *
                      (1 - TAIKO_DIMENSIONS.hitZoneX);

                  return (
                    <TaikoNoteComponent
                      key={note.id}
                      noteType={note.noteType}
                      large={note.large}
                      position={position}
                      hit={note.hit}
                      rating={note.rating}
                    />
                  );
                })}

                {/* Combo display */}
                {combo >= 5 && (
                  <m.div
                    className="absolute top-2 left-1/2 -translate-x-1/2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    key={Math.floor(combo / 5)}
                  >
                    <span
                      className="font-mono text-3xl font-bold"
                      style={{ color: COLORS.don, textShadow: `0 0 20px ${COLORS.don}80` }}
                    >
                      {combo}x
                    </span>
                  </m.div>
                )}
              </div>

              {/* Drum display */}
              <div className="mt-6 flex justify-center">
                <DrumDisplay
                  lastHitType={lastHitType}
                  lastHitRating={lastHitRating}
                  hitEffectVersion={hitEffectVersion}
                />
              </div>

              {/* Touch controls for mobile */}
              <div className="mt-6 flex gap-4 sm:hidden">
                <m.button
                  onTouchStart={handleTouchKat}
                  className="flex-1 py-8 rounded-xl text-white font-bold text-lg"
                  style={{ backgroundColor: COLORS.kat }}
                  whileTap={{ scale: 0.95 }}
                >
                  KAT
                </m.button>
                <m.button
                  onTouchStart={handleTouchDon}
                  className="flex-1 py-8 rounded-xl text-white font-bold text-lg"
                  style={{ backgroundColor: COLORS.don }}
                  whileTap={{ scale: 0.95 }}
                >
                  DON
                </m.button>
                <m.button
                  onTouchStart={handleTouchKat}
                  className="flex-1 py-8 rounded-xl text-white font-bold text-lg"
                  style={{ backgroundColor: COLORS.kat }}
                  whileTap={{ scale: 0.95 }}
                >
                  KAT
                </m.button>
              </div>

              {/* Stats */}
              <div className="flex justify-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.perfect }} />
                  <span className="text-sm text-[var(--pg-text-secondary)]">Perfect</span>
                  <span className="font-mono" style={{ color: COLORS.perfect }}>{perfects}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.good }} />
                  <span className="text-sm text-[var(--pg-text-secondary)]">Good</span>
                  <span className="font-mono" style={{ color: COLORS.good }}>{goods}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.miss }} />
                  <span className="text-sm text-[var(--pg-text-secondary)]">Miss</span>
                  <span className="font-mono" style={{ color: COLORS.miss }}>{misses}</span>
                </div>
              </div>

              {/* Key hint */}
              <p className="text-center text-[var(--pg-text-muted)] text-xs mt-4 hidden sm:block">
                <span style={{ color: COLORS.don }}>D/F</span> for Don (center) ·{' '}
                <span style={{ color: COLORS.kat }}>J/K</span> for Kat (rim)
              </p>
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
                title={selectedMap.name}
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
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </GameLayout>
  );
}

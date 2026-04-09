'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Music, Upload, List, Volume2, VolumeX } from 'lucide-react';
import { GameLayout, ResultsScreen, CountdownOverlay } from '../shared';
import { useRhythmGame } from './RhythmGame.hooks';
import { HitCircle } from './HitCircle';
import { AudioUploader } from './AudioUploader';
import { useHighScores } from '../Playground.hooks';
import { BeatMap } from '../Playground.types';
import { DIFFICULTY_COLORS } from '../Playground.config';
import { RHYTHM_BEAT_MAPS } from './RhythmGame.config';
import { GeneratedBeatmap } from './audio';
import { isNewHighScore, formatNumber } from '../Playground.utils';
import { springs } from '../design';

type ViewMode = 'presets' | 'upload';

// Convert GeneratedBeatmap to BeatMap format
function convertToBeatMap(generated: GeneratedBeatmap): BeatMap {
  return {
    id: generated.id,
    name: generated.name,
    artist: generated.artist,
    audioUrl: '', // Will use audioBuffer directly
    bpm: generated.bpm,
    duration: generated.duration,
    difficulty: generated.difficulty,
    notes: generated.notes.map((n) => ({
      id: n.id,
      time: n.time,
      x: n.x,
      y: n.y,
    })),
  };
}

export function RhythmGame() {
  const [viewMode, setViewMode] = useState<ViewMode>('presets');
  const [selectedMap, setSelectedMap] = useState<BeatMap>(RHYTHM_BEAT_MAPS[0]);
  const [customBeatmap, setCustomBeatmap] = useState<GeneratedBeatmap | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

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
    startGame,
    startPlaying,
    handleNoteClick,
    handlePlayfieldClick,
    resetGame,
    getCurrentTime,
  } = useRhythmGame(selectedMap);

  const { scores, saveScore } = useHighScores('rhythm');
  const playfieldRef = useRef<HTMLDivElement>(null);

  const isFinished = status === 'finished';
  const currentBest = scores?.[selectedMap.id]?.score;
  const isNewBest = isFinished && result && isNewHighScore(result.score, currentBest);
  const isCustomSong = customBeatmap !== null && selectedMap.id === customBeatmap.id;

  const playAudio = useCallback((audioBuffer: AudioBuffer) => {
    // Create or resume audio context
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const ctx = audioContextRef.current;

    // Create gain node for volume control
    if (!gainNodeRef.current) {
      gainNodeRef.current = ctx.createGain();
      gainNodeRef.current.connect(ctx.destination);
    }

    // Stop any existing playback
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current.disconnect();
    }

    // Create and start new source
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(gainNodeRef.current);
    source.start(0);

    audioSourceRef.current = source;

    // Handle playback end
    source.onended = () => {
      audioSourceRef.current = null;
    };
  }, []);

  const stopAudio = useCallback(() => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
  }, []);

  // Initialize audio context
  useEffect(() => {
    return () => {
      // Cleanup audio on unmount
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Start audio when game starts playing (for custom songs)
  useEffect(() => {
    if (status === 'playing' && isCustomSong && customBeatmap?.audioBuffer) {
      playAudio(customBeatmap.audioBuffer);
    }

    if (status === 'finished' || status === 'idle') {
      stopAudio();
    }
  }, [status, isCustomSong, customBeatmap, playAudio, stopAudio]);

  // Handle mute toggle
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : 1;
    }
  }, [isMuted]);

  // Handle custom beatmap generation
  const handleBeatmapGenerated = useCallback((beatmap: GeneratedBeatmap) => {
    setCustomBeatmap(beatmap);
    setSelectedMap(convertToBeatMap(beatmap));
    setViewMode('presets'); // Return to main view
  }, []);

  // Save score
  const handlePlayAgain = useCallback(() => {
    if (result && result.score > 0) {
      const currentMapScores = scores?.[selectedMap.id];
      const newScores = {
        ...(scores ?? {}),
        [selectedMap.id]: {
          score:
            currentMapScores?.score && currentMapScores.score > result.score
              ? currentMapScores.score
              : result.score,
          maxCombo:
            currentMapScores?.maxCombo && currentMapScores.maxCombo > result.maxCombo
              ? currentMapScores.maxCombo
              : result.maxCombo,
          accuracy:
            currentMapScores?.accuracy && currentMapScores.accuracy > result.accuracy
              ? currentMapScores.accuracy
              : result.accuracy,
        },
      };
      saveScore(newScores);
    }
    resetGame();
  }, [result, scores, selectedMap.id, saveScore, resetGame]);

  // Handle click on playfield
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (status !== 'playing' || !playfieldRef.current) return;

      const rect = playfieldRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      handlePlayfieldClick(x, y);
    },
    [status, handlePlayfieldClick]
  );

  const showIdle = status === 'idle';
  const showCountdown = status === 'countdown';
  const showGame = status === 'playing';
  const showResults = status === 'finished';

  return (
    <GameLayout
      title="Rhythm Game"
      subtitle={showGame ? selectedMap.name : undefined}
      headerRight={
        showGame ? (
          <div className="flex items-center gap-4">
            {isCustomSong && (
              <motion.button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-lg hover:bg-white/5"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-[var(--pg-text-muted)]" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[var(--pg-text-secondary)]" />
                )}
              </motion.button>
            )}
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-semibold text-[var(--pg-accent-gold)]">
                {formatNumber(score)}
              </span>
            </div>
            {combo > 0 && (
              <>
                <div className="w-px h-5 bg-white/10" />
                <motion.span
                  key={combo}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="font-mono text-[var(--purple)] font-semibold"
                >
                  {combo}x
                </motion.span>
              </>
            )}
          </div>
        ) : null
      }
    >
      <CountdownOverlay isActive={showCountdown} onComplete={startPlaying} />

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {/* Upload view */}
          {showIdle && viewMode === 'upload' && (
            <AudioUploader
              key="upload"
              mode="osu"
              onBeatmapGenerated={handleBeatmapGenerated}
              onCancel={() => setViewMode('presets')}
            />
          )}

          {/* Song selection */}
          {showIdle && viewMode === 'presets' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={springs.gentle}
              className="text-center w-full max-w-lg"
            >
              {/* Icon */}
              <motion.div
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[var(--pg-accent-gold)]/10 text-[var(--pg-accent-gold)] mb-6"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={springs.bouncy}
              >
                <Music className="w-10 h-10" />
              </motion.div>

              <h2 className="text-4xl sm:text-5xl font-bold text-[var(--pg-text-primary)] mb-4 tracking-tight">
                Rhythm Game
              </h2>

              <p className="text-[var(--pg-text-secondary)] mb-6 text-lg">
                Click the circles when the approach ring reaches them.
              </p>

              {/* Mode toggle */}
              <div className="flex justify-center gap-2 mb-8">
                <motion.button
                  onClick={() => setViewMode('presets')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-[var(--pg-accent-gold)] text-black"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <List className="w-4 h-4" />
                  Presets
                </motion.button>
                <motion.button
                  onClick={() => setViewMode('upload')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-[var(--pg-bg-elevated)] text-[var(--pg-text-secondary)] hover:bg-[var(--pg-bg-hover)]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </motion.button>
              </div>

              {/* Song list */}
              <div className="space-y-3 mb-10">
                {/* Custom beatmap if available */}
                {customBeatmap && (
                  <motion.button
                    onClick={() => setSelectedMap(convertToBeatMap(customBeatmap))}
                    className={`
                      w-full p-4 rounded-xl text-left transition-all duration-200
                      ${
                        selectedMap.id === customBeatmap.id
                          ? 'bg-[var(--purple)]/20 border-[var(--purple)]/40 shadow-lg shadow-[var(--purple)]/10'
                          : 'bg-[var(--pg-bg-elevated)] hover:bg-[var(--pg-bg-hover)] border-white/[0.06]'
                      }
                      border
                    `}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <Upload className="w-4 h-4 text-[var(--purple)]" />
                          <span className="font-semibold text-[var(--pg-text-primary)]">
                            {customBeatmap.name}
                          </span>
                        </div>
                        <div className="text-sm text-[var(--pg-text-muted)] ml-6">
                          {customBeatmap.artist} · {customBeatmap.bpm} BPM · {Math.round(customBeatmap.duration)}s
                        </div>
                      </div>
                      <div
                        className={`
                          px-2.5 py-1 rounded-lg text-xs font-medium capitalize border
                          ${DIFFICULTY_COLORS[customBeatmap.difficulty]}
                        `}
                      >
                        {customBeatmap.difficulty}
                      </div>
                    </div>
                  </motion.button>
                )}

                {/* Preset songs */}
                {RHYTHM_BEAT_MAPS.map((map) => (
                  <motion.button
                    key={map.id}
                    onClick={() => setSelectedMap(map)}
                    className={`
                      w-full p-4 rounded-xl text-left transition-all duration-200
                      ${
                        selectedMap.id === map.id
                          ? 'bg-[var(--pg-accent-gold)]/10 border-[var(--pg-accent-gold)]/40 shadow-lg shadow-[var(--pg-accent-gold)]/10'
                          : 'bg-[var(--pg-bg-elevated)] hover:bg-[var(--pg-bg-hover)] border-white/[0.06]'
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
                        className={`
                          px-2.5 py-1 rounded-lg text-xs font-medium capitalize border
                          ${DIFFICULTY_COLORS[map.difficulty]}
                        `}
                      >
                        {map.difficulty}
                      </div>
                    </div>
                    {scores?.[map.id] && (
                      <div className="mt-2 pt-2 border-t border-white/[0.06] flex gap-4 text-xs">
                        <span className="text-[var(--pg-text-muted)]">
                          Best: <span className="text-[var(--pg-accent-gold)] font-mono">{formatNumber(scores[map.id].score)}</span>
                        </span>
                        <span className="text-[var(--pg-text-muted)]">
                          Combo: <span className="text-[var(--purple)] font-mono">{scores[map.id].maxCombo}x</span>
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
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[var(--purple)] to-[var(--pg-accent-gold)]"
                    style={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>

              {/* Playfield */}
              <div
                ref={playfieldRef}
                onClick={handleClick}
                className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden cursor-pointer border border-white/[0.06]"
                style={{
                  background:
                    'radial-gradient(ellipse at center, rgba(167, 139, 250, 0.08) 0%, var(--pg-bg-surface) 100%)',
                }}
              >
                {/* Subtle grid pattern */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(167, 139, 250, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(167, 139, 250, 0.15) 1px, transparent 1px)',
                    backgroundSize: '50px 50px',
                  }}
                />

                {/* Hit circles */}
                {activeNotes.map((note) => (
                  <HitCircle
                    key={note.id}
                    id={note.id}
                    x={note.x}
                    y={note.y}
                    targetTime={note.time}
                    hit={note.hit}
                    rating={note.rating}
                    onClick={handleNoteClick}
                    getCurrentTime={getCurrentTime}
                  />
                ))}

                {/* Combo display overlay */}
                {combo >= 5 && (
                  <motion.div
                    className="absolute top-4 left-1/2 -translate-x-1/2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    key={Math.floor(combo / 5)}
                  >
                    <span className="font-mono text-4xl font-bold text-[var(--purple)]" style={{ textShadow: '0 0 20px rgba(167, 139, 250, 0.5)' }}>
                      {combo}x
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Stats */}
              <div className="flex justify-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--pg-game-perfect)]" />
                  <span className="text-sm text-[var(--pg-text-secondary)]">Perfect</span>
                  <span className="font-mono text-[var(--pg-game-perfect)]">{perfects}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--pg-game-success)]" />
                  <span className="text-sm text-[var(--pg-text-secondary)]">Good</span>
                  <span className="font-mono text-[var(--pg-game-success)]">{goods}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--pg-game-error)]" />
                  <span className="text-sm text-[var(--pg-text-secondary)]">Miss</span>
                  <span className="font-mono text-[var(--pg-game-error)]">{misses}</span>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameLayout>
  );
}

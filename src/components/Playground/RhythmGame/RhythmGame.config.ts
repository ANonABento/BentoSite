/**
 * Rhythm Game - Beat maps and configurations
 */

import { BeatNote, BeatMap } from '../Playground.types';

// Generate a simple beat pattern
function generateBeats(
  bpm: number,
  durationSeconds: number,
  pattern: 'simple' | 'medium' | 'complex'
): BeatNote[] {
  const notes: BeatNote[] = [];
  const beatInterval = 60000 / bpm; // ms per beat

  // Start after 2 seconds
  let time = 2000;
  const endTime = durationSeconds * 1000 - 2000;
  let id = 0;

  while (time < endTime) {
    const positions = getPositionsForPattern(pattern);

    for (const pos of positions) {
      notes.push({
        id: `note-${id++}`,
        time,
        x: pos.x,
        y: pos.y,
      });
      time += beatInterval / positions.length;
    }

    // Skip some beats occasionally for variety
    if (Math.random() > 0.8) {
      time += beatInterval;
    }
  }

  return notes;
}

function getPositionsForPattern(
  pattern: 'simple' | 'medium' | 'complex'
): { x: number; y: number }[] {
  // Random positions in the playfield (0.1 to 0.9 to stay away from edges)
  const randX = () => 0.15 + Math.random() * 0.7;
  const randY = () => 0.15 + Math.random() * 0.7;

  switch (pattern) {
    case 'simple':
      // Single notes
      return [{ x: randX(), y: randY() }];
    case 'medium':
      // Sometimes double notes
      if (Math.random() > 0.7) {
        return [
          { x: 0.3, y: randY() },
          { x: 0.7, y: randY() },
        ];
      }
      return [{ x: randX(), y: randY() }];
    case 'complex':
      // More variety
      const r = Math.random();
      if (r > 0.8) {
        return [
          { x: 0.25, y: randY() },
          { x: 0.5, y: randY() },
          { x: 0.75, y: randY() },
        ];
      } else if (r > 0.5) {
        return [
          { x: 0.35, y: randY() },
          { x: 0.65, y: randY() },
        ];
      }
      return [{ x: randX(), y: randY() }];
  }
}

// Pre-generated beat maps (no audio required)
export const RHYTHM_BEAT_MAPS: BeatMap[] = [
  {
    id: 'warmup',
    name: 'Warmup',
    artist: 'Practice Mode',
    audioUrl: '', // No audio - visual only
    bpm: 80,
    duration: 30,
    difficulty: 'easy',
    notes: generateBeats(80, 30, 'simple'),
  },
  {
    id: 'steady-beat',
    name: 'Steady Beat',
    artist: 'Training',
    audioUrl: '',
    bpm: 100,
    duration: 45,
    difficulty: 'medium',
    notes: generateBeats(100, 45, 'medium'),
  },
  {
    id: 'fast-track',
    name: 'Fast Track',
    artist: 'Challenge',
    audioUrl: '',
    bpm: 140,
    duration: 60,
    difficulty: 'hard',
    notes: generateBeats(140, 60, 'complex'),
  },
];

// Timing constants
export const APPROACH_TIME = 1200; // ms before hit
export const HIT_CIRCLE_SIZE = 80; // px
export const TIMING_WINDOWS = {
  perfect: 50, // ±50ms
  good: 120, // ±120ms
  miss: 200, // >200ms = miss
};

export const SCORING = {
  perfect: 300,
  good: 100,
  miss: 0,
};

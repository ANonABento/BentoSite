/**
 * Taiko Game Configuration
 */

import { GeneratedNote } from '../audio';

export type TaikoNoteType = 'don' | 'kat';

export interface TaikoNote extends GeneratedNote {
  noteType: TaikoNoteType;
  large?: boolean;
}

export interface TaikoBeatMap {
  id: string;
  name: string;
  artist: string;
  bpm: number;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  notes: TaikoNote[];
}

// Timing windows in ms
export const TIMING_WINDOWS = {
  perfect: 30,
  good: 80,
  miss: 150,
};

// Scoring
export const SCORING = {
  perfect: 300,
  good: 150,
  miss: 0,
};

// Colors
export const COLORS = {
  don: '#ee5533', // Red/orange for center hits
  kat: '#4488ff', // Blue for rim hits
  donLarge: '#ff6644',
  katLarge: '#5599ff',
  hitZone: 'rgba(255, 255, 255, 0.1)',
  perfect: '#ffd700',
  good: '#4ade80',
  miss: '#f87171',
};

// Key bindings
export const KEY_BINDINGS = {
  don: ['d', 'f', 'D', 'F'],
  kat: ['j', 'k', 'J', 'K'],
};

// Game dimensions
export const TAIKO_DIMENSIONS = {
  noteSize: 60,
  largeNoteSize: 80,
  hitZoneX: 0.15, // Position of hit zone (0-1)
  scrollSpeed: 0.5, // Notes per second across screen
  approachTime: 2000, // ms before note reaches hit zone
};

// Generate Taiko beatmap from standard beatmap
export function generateTaikoBeatMap(
  notes: GeneratedNote[],
  name: string,
  artist: string,
  bpm: number,
  duration: number,
  difficulty: 'easy' | 'medium' | 'hard'
): TaikoBeatMap {
  const taikoNotes: TaikoNote[] = notes.map((note) => ({
    ...note,
    noteType: note.type === 'drum-don' ? 'don' : (note.type === 'drum-kat' ? 'kat' : (Math.random() > 0.5 ? 'don' : 'kat')),
    large: Math.random() > 0.9, // 10% chance of large notes
  }));

  return {
    id: `taiko-${Date.now()}`,
    name,
    artist,
    bpm,
    duration,
    difficulty,
    notes: taikoNotes,
  };
}

// Pre-generated Taiko practice maps
function generateTaikoPracticeNotes(
  bpm: number,
  durationSeconds: number,
  complexity: 'simple' | 'medium' | 'complex'
): TaikoNote[] {
  const notes: TaikoNote[] = [];
  const beatInterval = 60000 / bpm;
  let time = 2000; // Start after 2 seconds
  const endTime = durationSeconds * 1000 - 2000;
  let id = 0;

  while (time < endTime) {
    const noteType: TaikoNoteType = Math.random() > 0.5 ? 'don' : 'kat';
    const large = complexity === 'complex' && Math.random() > 0.85;

    notes.push({
      id: `taiko-${id++}`,
      time,
      x: 1, // Start from right
      y: 0.5,
      type: noteType === 'don' ? 'drum-don' : 'drum-kat',
      noteType,
      large,
    });

    // Add more notes for higher complexity
    if (complexity === 'complex' && Math.random() > 0.6) {
      time += beatInterval / 2;
      if (time < endTime) {
        notes.push({
          id: `taiko-${id++}`,
          time,
          x: 1,
          y: 0.5,
          type: noteType === 'don' ? 'drum-kat' : 'drum-don',
          noteType: noteType === 'don' ? 'kat' : 'don',
        });
      }
    } else if (complexity === 'medium' && Math.random() > 0.7) {
      time += beatInterval / 2;
    }

    time += beatInterval;

    // Skip some beats for variety
    if (Math.random() > 0.85) {
      time += beatInterval;
    }
  }

  return notes;
}

export const TAIKO_BEAT_MAPS: TaikoBeatMap[] = [
  {
    id: 'taiko-warmup',
    name: 'Drum Warmup',
    artist: 'Practice',
    bpm: 80,
    duration: 30,
    difficulty: 'easy',
    notes: generateTaikoPracticeNotes(80, 30, 'simple'),
  },
  {
    id: 'taiko-steady',
    name: 'Steady Rhythm',
    artist: 'Training',
    bpm: 100,
    duration: 45,
    difficulty: 'medium',
    notes: generateTaikoPracticeNotes(100, 45, 'medium'),
  },
  {
    id: 'taiko-rush',
    name: 'Drum Rush',
    artist: 'Challenge',
    bpm: 140,
    duration: 60,
    difficulty: 'hard',
    notes: generateTaikoPracticeNotes(140, 60, 'complex'),
  },
];

/**
 * Mania Game Configuration
 */

import { GeneratedNote } from '../audio';

export type KeyCount = 4 | 5 | 6 | 7;

export interface ManiaNote extends GeneratedNote {
  lane: number;
  holdDuration?: number; // For hold notes
}

export interface ManiaBeatMap {
  id: string;
  name: string;
  artist: string;
  bpm: number;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  keyCount: KeyCount;
  notes: ManiaNote[];
}

// Timing windows in ms
export const TIMING_WINDOWS = {
  perfect: 20,
  great: 50,
  good: 100,
  miss: 150,
};

// Scoring
export const SCORING = {
  perfect: 300,
  great: 200,
  good: 100,
  miss: 0,
};

// Lane colors
export const LANE_COLORS: Record<KeyCount, string[]> = {
  4: ['#8b5cf6', '#f59e0b', '#f59e0b', '#8b5cf6'],
  5: ['#8b5cf6', '#f59e0b', '#22c55e', '#f59e0b', '#8b5cf6'],
  6: ['#8b5cf6', '#f59e0b', '#22c55e', '#22c55e', '#f59e0b', '#8b5cf6'],
  7: ['#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'],
};

// Key bindings for different key counts
export const KEY_BINDINGS: Record<KeyCount, string[]> = {
  4: ['d', 'f', 'j', 'k'],
  5: ['d', 'f', 'space', 'j', 'k'],
  6: ['s', 'd', 'f', 'j', 'k', 'l'],
  7: ['s', 'd', 'f', 'space', 'j', 'k', 'l'],
};

// Game dimensions
export const MANIA_DIMENSIONS = {
  laneWidth: 60,
  noteHeight: 20,
  receptorY: 0.85, // Position of receptor line (0-1)
  scrollSpeed: 500, // Pixels per second
  approachTime: 1500, // ms from spawn to hit
};

// Colors
export const COLORS = {
  receptor: 'rgba(255, 255, 255, 0.8)',
  receptorGlow: 'rgba(255, 255, 255, 0.3)',
  perfect: '#ffd700',
  great: '#22d3ee',
  good: '#4ade80',
  miss: '#f87171',
  holdBody: 'rgba(255, 255, 255, 0.3)',
};

// Generate Mania notes from standard beatmap
export function generateManiaBeatMap(
  notes: GeneratedNote[],
  name: string,
  artist: string,
  bpm: number,
  duration: number,
  difficulty: 'easy' | 'medium' | 'hard',
  keyCount: KeyCount
): ManiaBeatMap {
  const maniaNotes: ManiaNote[] = notes.map((note) => {
    // Assign lanes based on frequency or random
    let lane: number;
    if (note.lane !== undefined) {
      lane = note.lane % keyCount;
    } else {
      // Distribute across lanes based on position
      lane = Math.floor(note.x * keyCount);
    }

    return {
      ...note,
      lane,
      y: 0, // Starts at top
    };
  });

  return {
    id: `mania-${Date.now()}`,
    name,
    artist,
    bpm,
    duration,
    difficulty,
    keyCount,
    notes: maniaNotes,
  };
}

// Pre-generated Mania practice maps
function generateManiaPracticeNotes(
  bpm: number,
  durationSeconds: number,
  keyCount: KeyCount,
  complexity: 'simple' | 'medium' | 'complex'
): ManiaNote[] {
  const notes: ManiaNote[] = [];
  const beatInterval = 60000 / bpm;
  let time = 2000; // Start after 2 seconds
  const endTime = durationSeconds * 1000 - 2000;
  let id = 0;
  let lastLane = -1;

  while (time < endTime) {
    // Generate 1-3 notes per beat depending on complexity
    const noteCount = complexity === 'complex' ? (Math.random() > 0.7 ? 2 : 1) :
                     complexity === 'medium' ? (Math.random() > 0.85 ? 2 : 1) : 1;

    const usedLanes = new Set<number>();

    for (let n = 0; n < noteCount; n++) {
      // Pick a lane, avoiding the last used lane and current beat's lanes
      let lane: number;
      let attempts = 0;
      do {
        lane = Math.floor(Math.random() * keyCount);
        attempts++;
      } while ((usedLanes.has(lane) || (attempts < 3 && lane === lastLane)) && attempts < 10);

      usedLanes.add(lane);
      lastLane = lane;

      // Occasionally add hold notes on harder difficulties
      const holdDuration = complexity !== 'simple' && Math.random() > 0.9
        ? beatInterval * (1 + Math.floor(Math.random() * 2))
        : undefined;

      notes.push({
        id: `mania-${id++}`,
        time,
        x: (lane + 0.5) / keyCount,
        y: 0,
        type: holdDuration ? 'hold' : 'tap',
        lane,
        holdDuration,
      });
    }

    // Add subdivisions on complex difficulty
    if (complexity === 'complex' && Math.random() > 0.6) {
      time += beatInterval / 2;
    } else if (complexity === 'medium' && Math.random() > 0.8) {
      time += beatInterval / 2;
    }

    time += beatInterval;

    // Skip some beats for variety
    if (Math.random() > 0.9) {
      time += beatInterval;
    }
  }

  return notes.sort((a, b) => a.time - b.time);
}

export const MANIA_BEAT_MAPS: ManiaBeatMap[] = [
  {
    id: 'mania-warmup-4k',
    name: '4K Warmup',
    artist: 'Practice',
    bpm: 80,
    duration: 30,
    difficulty: 'easy',
    keyCount: 4,
    notes: generateManiaPracticeNotes(80, 30, 4, 'simple'),
  },
  {
    id: 'mania-flow-4k',
    name: '4K Flow',
    artist: 'Training',
    bpm: 100,
    duration: 45,
    difficulty: 'medium',
    keyCount: 4,
    notes: generateManiaPracticeNotes(100, 45, 4, 'medium'),
  },
  {
    id: 'mania-rush-4k',
    name: '4K Rush',
    artist: 'Challenge',
    bpm: 140,
    duration: 60,
    difficulty: 'hard',
    keyCount: 4,
    notes: generateManiaPracticeNotes(140, 60, 4, 'complex'),
  },
  {
    id: 'mania-warmup-7k',
    name: '7K Basics',
    artist: 'Practice',
    bpm: 75,
    duration: 30,
    difficulty: 'medium',
    keyCount: 7,
    notes: generateManiaPracticeNotes(75, 30, 7, 'simple'),
  },
];

/**
 * Playground - Game configurations and constants
 */

import { TypingDifficulty, BeatMap } from './Playground.types';

// Reaction game config
export const REACTION_CONFIG = {
  totalRounds: 5,
  minDelay: 2000, // ms before green
  maxDelay: 5000, // ms before green
  tooEarlyPenalty: 500, // ms added for early click
} as const;

// Timing thresholds for rating
export const REACTION_RATINGS = {
  excellent: 200, // < 200ms
  good: 300, // < 300ms
  average: 400, // < 400ms
} as const;

// Typing game config
export const TYPING_CONFIG = {
  durations: [30, 60, 120] as const,
  difficulties: ['easy', 'medium', 'hard'] as const,
} as const;

// Word lists by difficulty
export const WORD_LISTS: Record<TypingDifficulty, string[]> = {
  easy: [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it',
    'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this',
    'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or',
    'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
    'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
    'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could',
    'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come',
    'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how',
    'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because',
  ],
  medium: [
    'through', 'before', 'should', 'where', 'between', 'system', 'never',
    'under', 'always', 'school', 'still', 'every', 'program', 'while',
    'might', 'found', 'against', 'government', 'without', 'however',
    'thought', 'world', 'different', 'possible', 'company', 'problem',
    'important', 'another', 'question', 'business', 'development',
    'during', 'country', 'example', 'include', 'children', 'together',
    'something', 'continue', 'national', 'nothing', 'provide', 'public',
    'already', 'community', 'remember', 'believe', 'perhaps', 'although',
    'available', 'following', 'experience', 'education', 'probably',
    'information', 'relationship', 'especially', 'themselves', 'everything',
  ],
  hard: [
    'javascript', 'typescript', 'function', 'variable', 'component',
    'algorithm', 'interface', 'callback', 'parameter', 'asynchronous',
    'dependency', 'framework', 'middleware', 'authentication', 'authorization',
    'deployment', 'infrastructure', 'architecture', 'microservices', 'kubernetes',
    'containerization', 'virtualization', 'encryption', 'decryption',
    'optimization', 'refactoring', 'debugging', 'abstraction', 'polymorphism',
    'inheritance', 'encapsulation', 'serialization', 'deserialization',
    'configuration', 'implementation', 'documentation', 'specification',
    'compatibility', 'accessibility', 'responsiveness', 'performance',
    'scalability', 'maintainability', 'sustainability', 'interoperability',
    'synchronization', 'parallelization', 'concatenation', 'interpolation',
  ],
};

// Rhythm game config
export const RHYTHM_CONFIG = {
  // Timing windows in ms
  timingWindows: {
    perfect: 50, // ±50ms
    good: 100, // ±100ms
    miss: 150, // >150ms = miss
  },
  // Score multipliers
  scoring: {
    perfect: 300,
    good: 100,
    miss: 0,
  },
  // Approach circle timing
  approachTime: 1000, // ms before hit
} as const;

// Placeholder beat maps (will be expanded)
export const BEAT_MAPS: BeatMap[] = [
  {
    id: 'demo-easy',
    name: 'First Steps',
    artist: 'Tutorial',
    audioUrl: '/audio/demo-easy.mp3',
    bpm: 100,
    duration: 30,
    difficulty: 'easy',
    notes: [], // Will be generated
  },
];

// Storage keys
export const STORAGE_KEYS = {
  highScores: 'playground-high-scores',
  preferences: 'playground-preferences',
} as const;

// Shared difficulty badge colors (used across rhythm games)
export const DIFFICULTY_COLORS = {
  easy: 'bg-[var(--pg-game-success)]/15 text-[var(--pg-game-success)] border-[var(--pg-game-success)]/30',
  medium: 'bg-[var(--pg-accent-primary)]/15 text-[var(--pg-accent-primary)] border-[var(--pg-accent-primary)]/30',
  hard: 'bg-[var(--pg-game-error)]/15 text-[var(--pg-game-error)] border-[var(--pg-game-error)]/30',
} as const;

// Generate random text for typing game
export function generateTypingText(
  difficulty: TypingDifficulty,
  wordCount: number = 50
): string {
  const words = WORD_LISTS[difficulty];
  const result: string[] = [];

  for (let i = 0; i < wordCount; i++) {
    const randomIndex = Math.floor(Math.random() * words.length);
    result.push(words[randomIndex]);
  }

  return result.join(' ');
}

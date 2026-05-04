/**
 * Soundboard - Configuration and constants
 */

import { SoundPad } from './Soundboard.types';

// Grid layout
export const GRID_COLS = 4;
export const PAD_SIZE = 80;
export const PAD_SIZE_MOBILE = 64;
export const PAD_GAP = 12;

// Keyboard layout for pads (4x4 grid)
export const KEY_BINDINGS = [
  ['1', '2', '3', '4'],
  ['q', 'w', 'e', 'r'],
  ['a', 's', 'd', 'f'],
  ['z', 'x', 'c', 'v'],
];

// Flatten key bindings for easy lookup
export const FLAT_KEY_BINDINGS = KEY_BINDINGS.flat();

// Category colors
export const CATEGORY_COLORS = {
  drums: '#ef4444',    // red
  effects: '#3b82f6',  // blue
  memes: '#d4722f',    // primary
  custom: '#e07b3c',   // primary
};

// Default sound pads (using emoji placeholders since we don't have audio files)
export const DEFAULT_PADS: SoundPad[] = [
  // Drums row
  { id: 'kick', name: 'Kick', emoji: '🥁', color: '#ef4444', audioUrl: '', keyBinding: '1', volume: 1, category: 'drums' },
  { id: 'snare', name: 'Snare', emoji: '🪘', color: '#ef4444', audioUrl: '', keyBinding: '2', volume: 1, category: 'drums' },
  { id: 'hihat', name: 'Hi-Hat', emoji: '🎵', color: '#ef4444', audioUrl: '', keyBinding: '3', volume: 1, category: 'drums' },
  { id: 'clap', name: 'Clap', emoji: '👏', color: '#ef4444', audioUrl: '', keyBinding: '4', volume: 1, category: 'drums' },

  // Effects row
  { id: 'rise', name: 'Rise', emoji: '📈', color: '#3b82f6', audioUrl: '', keyBinding: 'q', volume: 1, category: 'effects' },
  { id: 'drop', name: 'Drop', emoji: '💥', color: '#3b82f6', audioUrl: '', keyBinding: 'w', volume: 1, category: 'effects' },
  { id: 'woosh', name: 'Woosh', emoji: '💨', color: '#3b82f6', audioUrl: '', keyBinding: 'e', volume: 1, category: 'effects' },
  { id: 'ding', name: 'Ding', emoji: '🔔', color: '#3b82f6', audioUrl: '', keyBinding: 'r', volume: 1, category: 'effects' },

  // Memes row
  { id: 'airhorn', name: 'Airhorn', emoji: '📢', color: '#d4722f', audioUrl: '', keyBinding: 'a', volume: 1, category: 'memes' },
  { id: 'bruh', name: 'Bruh', emoji: '😐', color: '#d4722f', audioUrl: '', keyBinding: 's', volume: 1, category: 'memes' },
  { id: 'oof', name: 'Oof', emoji: '😵', color: '#d4722f', audioUrl: '', keyBinding: 'd', volume: 1, category: 'memes' },
  { id: 'wow', name: 'Wow', emoji: '😮', color: '#d4722f', audioUrl: '', keyBinding: 'f', volume: 1, category: 'memes' },

  // More effects
  { id: 'tada', name: 'Tada', emoji: '🎉', color: '#e07b3c', audioUrl: '', keyBinding: 'z', volume: 1, category: 'effects' },
  { id: 'laugh', name: 'Laugh', emoji: '😂', color: '#e07b3c', audioUrl: '', keyBinding: 'x', volume: 1, category: 'effects' },
  { id: 'applause', name: 'Applause', emoji: '👏', color: '#e07b3c', audioUrl: '', keyBinding: 'c', volume: 1, category: 'effects' },
  { id: 'crickets', name: 'Crickets', emoji: '🦗', color: '#e07b3c', audioUrl: '', keyBinding: 'v', volume: 1, category: 'effects' },
];

// Audio context will be created on first user interaction
export const AUDIO_CONTEXT_OPTIONS = {
  latencyHint: 'interactive' as AudioContextLatencyCategory,
  sampleRate: 44100,
};

/**
 * Audio Analysis Types
 */

export interface AudioAnalysis {
  bpm: number;
  duration: number;
  onsets: Onset[];
  spectralEnergy: number[];
  waveform: Float32Array;
}

export interface Onset {
  time: number; // Seconds
  strength: number; // 0-1 intensity
  frequency: 'low' | 'mid' | 'high';
}

export interface BeatmapSettings {
  difficulty: 'easy' | 'medium' | 'hard';
  noteSpacing: number; // Minimum ms between notes
  maxSimultaneous: number; // Max notes at same time
}

export interface GeneratedBeatmap {
  id: string;
  name: string;
  artist: string;
  bpm: number;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  notes: GeneratedNote[];
  audioBuffer: AudioBuffer;
}

export interface GeneratedNote {
  id: string;
  time: number; // ms from start
  x: number; // 0-1 position
  y: number; // 0-1 position
  lane?: number; // For mania mode
  type: 'tap' | 'hold' | 'drum-don' | 'drum-kat';
  duration?: number; // For hold notes
}

export type RhythmGameMode = 'osu' | 'taiko' | 'mania';

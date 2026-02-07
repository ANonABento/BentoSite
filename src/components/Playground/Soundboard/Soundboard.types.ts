/**
 * Soundboard - TypeScript interfaces
 */

export interface SoundPad {
  id: string;
  name: string;
  emoji: string;
  color: string;
  audioUrl: string;
  keyBinding: string;
  volume: number;
  category: SoundCategory;
}

export type SoundCategory = 'drums' | 'effects' | 'memes' | 'custom';

export interface SoundboardState {
  activePads: Set<string>;
  volume: number;
  selectedCategory: SoundCategory | 'all';
}

export interface CustomSound {
  id: string;
  name: string;
  audioData: string; // Base64 encoded
  color: string;
}

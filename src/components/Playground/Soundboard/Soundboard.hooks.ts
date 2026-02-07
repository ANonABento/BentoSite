/**
 * Soundboard - Audio and interaction hooks
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { SoundPad, SoundCategory } from './Soundboard.types';
import { DEFAULT_PADS, FLAT_KEY_BINDINGS } from './Soundboard.config';

// Simple oscillator-based sound generation (since we don't have audio files)
function createOscillatorSound(
  audioContext: AudioContext,
  frequency: number,
  type: OscillatorType = 'sine',
  duration: number = 0.1
): void {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

// Sound frequencies for different pads
const PAD_SOUNDS: Record<string, { freq: number; type: OscillatorType; duration: number }> = {
  kick: { freq: 60, type: 'sine', duration: 0.2 },
  snare: { freq: 200, type: 'triangle', duration: 0.1 },
  hihat: { freq: 800, type: 'square', duration: 0.05 },
  clap: { freq: 400, type: 'sawtooth', duration: 0.08 },
  rise: { freq: 300, type: 'sine', duration: 0.3 },
  drop: { freq: 100, type: 'sawtooth', duration: 0.4 },
  woosh: { freq: 500, type: 'sine', duration: 0.15 },
  ding: { freq: 1200, type: 'sine', duration: 0.3 },
  airhorn: { freq: 440, type: 'square', duration: 0.5 },
  bruh: { freq: 150, type: 'sawtooth', duration: 0.3 },
  oof: { freq: 200, type: 'triangle', duration: 0.2 },
  wow: { freq: 350, type: 'sine', duration: 0.4 },
  tada: { freq: 600, type: 'sine', duration: 0.25 },
  laugh: { freq: 400, type: 'triangle', duration: 0.3 },
  applause: { freq: 300, type: 'sawtooth', duration: 0.5 },
  crickets: { freq: 2000, type: 'sine', duration: 0.1 },
};

export function useSoundboard() {
  const [pads] = useState<SoundPad[]>(DEFAULT_PADS);
  const [activePads, setActivePads] = useState<Set<string>>(new Set());
  const [volume, setVolume] = useState(0.8);
  const [selectedCategory, setSelectedCategory] = useState<SoundCategory | 'all'>('all');

  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context on first interaction
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Play a pad sound
  const playPad = useCallback((padId: string) => {
    const ctx = initAudioContext();

    // Add to active pads for visual feedback
    setActivePads((prev) => new Set(prev).add(padId));

    // Remove from active after animation
    setTimeout(() => {
      setActivePads((prev) => {
        const next = new Set(prev);
        next.delete(padId);
        return next;
      });
    }, 150);

    // Play sound
    const sound = PAD_SOUNDS[padId];
    if (sound) {
      createOscillatorSound(ctx, sound.freq, sound.type, sound.duration);
    }
  }, [initAudioContext]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();
      const padIndex = FLAT_KEY_BINDINGS.indexOf(key);

      if (padIndex !== -1 && pads[padIndex]) {
        e.preventDefault();
        playPad(pads[padIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pads, playPad]);

  // Filter pads by category
  const filteredPads = selectedCategory === 'all'
    ? pads
    : pads.filter((pad) => pad.category === selectedCategory);

  return {
    pads: filteredPads,
    allPads: pads,
    activePads,
    volume,
    selectedCategory,
    setVolume,
    setSelectedCategory,
    playPad,
    initAudioContext,
  };
}

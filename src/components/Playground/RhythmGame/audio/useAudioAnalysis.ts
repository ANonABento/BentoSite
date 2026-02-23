'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioAnalyzer } from './AudioAnalyzer';
import { BeatmapGenerator } from './BeatmapGenerator';
import { AudioAnalysis, GeneratedBeatmap, RhythmGameMode } from './types';

interface UseAudioAnalysisReturn {
  // State
  isAnalyzing: boolean;
  analysis: AudioAnalysis | null;
  beatmap: GeneratedBeatmap | null;
  error: string | null;

  // Actions
  analyzeFile: (
    file: File,
    mode: RhythmGameMode,
    difficulty: 'easy' | 'medium' | 'hard',
    songName?: string,
    artist?: string
  ) => Promise<GeneratedBeatmap | null>;
  clearAnalysis: () => void;

  // Audio playback
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  isPlaying: boolean;
  currentTime: number;
}

export function useAudioAnalysis(): UseAudioAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null);
  const [beatmap, setBeatmap] = useState<GeneratedBeatmap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const analyzerRef = useRef<AudioAnalyzer | null>(null);
  const generatorRef = useRef<BeatmapGenerator | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  // Initialize analyzer and generator
  useEffect(() => {
    analyzerRef.current = new AudioAnalyzer();
    generatorRef.current = new BeatmapGenerator();

    return () => {
      analyzerRef.current?.dispose();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Update current time during playback
  useEffect(() => {
    if (!isPlaying) return;

    const updateTime = () => {
      const audioContext = analyzerRef.current?.getAudioContext();
      if (audioContext) {
        setCurrentTime(audioContext.currentTime - startTimeRef.current + pauseTimeRef.current);
      }
      rafRef.current = requestAnimationFrame(updateTime);
    };

    rafRef.current = requestAnimationFrame(updateTime);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isPlaying]);

  const analyzeFile = useCallback(
    async (
      file: File,
      mode: RhythmGameMode,
      difficulty: 'easy' | 'medium' | 'hard',
      songName?: string,
      artist?: string
    ): Promise<GeneratedBeatmap | null> => {
      if (!analyzerRef.current || !generatorRef.current) {
        setError('Audio analyzer not initialized');
        return null;
      }

      setIsAnalyzing(true);
      setError(null);

      try {
        // Resume audio context if needed
        await analyzerRef.current.resume();

        // Decode audio
        const audioBuffer = await analyzerRef.current.decodeAudio(file);

        // Analyze
        const analysisResult = await analyzerRef.current.analyze(audioBuffer);
        setAnalysis(analysisResult);

        // Generate beatmap
        const name = songName || file.name.replace(/\.[^/.]+$/, '');
        const generatedBeatmap = generatorRef.current.generate(
          analysisResult,
          audioBuffer,
          mode,
          difficulty,
          name,
          artist || 'Custom Upload'
        );

        setBeatmap(generatedBeatmap);
        setIsAnalyzing(false);
        return generatedBeatmap;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to analyze audio';
        setError(message);
        setIsAnalyzing(false);
        return null;
      }
    },
    []
  );

  const stop = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    pauseTimeRef.current = 0;
  }, []);

  const clearAnalysis = useCallback(() => {
    stop();
    setAnalysis(null);
    setBeatmap(null);
    setError(null);
    setCurrentTime(0);
    pauseTimeRef.current = 0;
  }, [stop]);

  const play = useCallback(() => {
    if (!beatmap?.audioBuffer || !analyzerRef.current) return;

    const audioContext = analyzerRef.current.getAudioContext();
    if (!audioContext) return;

    // Stop any existing playback
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
    }

    // Create new source
    const source = audioContext.createBufferSource();
    source.buffer = beatmap.audioBuffer;
    source.connect(audioContext.destination);

    // Resume from pause position
    const offset = pauseTimeRef.current;
    startTimeRef.current = audioContext.currentTime;
    source.start(0, offset);

    sourceRef.current = source;
    setIsPlaying(true);

    // Handle playback end
    source.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      pauseTimeRef.current = 0;
    };
  }, [beatmap]);

  const pause = useCallback(() => {
    if (sourceRef.current && isPlaying) {
      const audioContext = analyzerRef.current?.getAudioContext();
      if (audioContext) {
        pauseTimeRef.current = audioContext.currentTime - startTimeRef.current + pauseTimeRef.current;
      }
      sourceRef.current.stop();
      sourceRef.current.disconnect();
      sourceRef.current = null;
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const seek = useCallback(
    (time: number) => {
      const wasPlaying = isPlaying;
      if (isPlaying) {
        pause();
      }
      pauseTimeRef.current = Math.max(0, Math.min(time, beatmap?.duration || 0));
      setCurrentTime(pauseTimeRef.current);
      if (wasPlaying) {
        play();
      }
    },
    [isPlaying, pause, play, beatmap?.duration]
  );

  return {
    isAnalyzing,
    analysis,
    beatmap,
    error,
    analyzeFile,
    clearAnalysis,
    play,
    pause,
    stop,
    seek,
    isPlaying,
    currentTime,
  };
}

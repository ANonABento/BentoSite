/**
 * Audio Analyzer - Web Audio API analysis utilities
 */

import { AudioAnalysis, Onset } from './types';

const FFT_SIZE = 2048;
const HOP_SIZE = 512;

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new AudioContext();
    }
  }

  /**
   * Decode audio file to AudioBuffer
   */
  async decodeAudio(file: File): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    const arrayBuffer = await file.arrayBuffer();
    return this.audioContext.decodeAudioData(arrayBuffer);
  }

  /**
   * Analyze audio buffer for rhythm game
   */
  async analyze(audioBuffer: AudioBuffer): Promise<AudioAnalysis> {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;

    // Calculate spectral flux for onset detection
    const spectralFlux = this.calculateSpectralFlux(channelData);

    // Detect onsets from spectral flux
    const onsets = this.detectOnsets(spectralFlux, sampleRate);

    // Detect BPM
    const bpm = this.detectBPM(onsets);

    // Get overall energy for visualization
    const spectralEnergy = this.calculateEnergy(channelData, sampleRate);

    return {
      bpm,
      duration,
      onsets,
      spectralEnergy,
      waveform: channelData,
    };
  }

  /**
   * Calculate spectral flux (change in spectrum over time)
   */
  private calculateSpectralFlux(
    samples: Float32Array
  ): number[] {
    const flux: number[] = [];
    const numFrames = Math.floor((samples.length - FFT_SIZE) / HOP_SIZE);

    let prevSpectrum: number[] = new Array(FFT_SIZE / 2).fill(0);

    for (let frame = 0; frame < numFrames; frame++) {
      const start = frame * HOP_SIZE;
      const frameData = samples.slice(start, start + FFT_SIZE);

      // Apply Hanning window
      const windowed = this.applyWindow(frameData);

      // Calculate spectrum magnitude
      const spectrum = this.calculateMagnitudeSpectrum(windowed);

      // Calculate flux (positive half-wave rectified difference)
      let frameFlux = 0;
      for (let bin = 0; bin < spectrum.length; bin++) {
        const diff = spectrum[bin] - prevSpectrum[bin];
        if (diff > 0) {
          frameFlux += diff;
        }
      }

      flux.push(frameFlux);
      prevSpectrum = spectrum;
    }

    return flux;
  }

  /**
   * Apply Hanning window to reduce spectral leakage
   */
  private applyWindow(data: Float32Array): Float32Array {
    const windowed = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (data.length - 1)));
      windowed[i] = data[i] * window;
    }
    return windowed;
  }

  /**
   * Calculate magnitude spectrum using real-valued FFT approximation
   */
  private calculateMagnitudeSpectrum(data: Float32Array): number[] {
    // Simple DFT for small data (not optimized, but works)
    const N = data.length;
    const spectrum: number[] = [];

    for (let k = 0; k < N / 2; k++) {
      let real = 0;
      let imag = 0;

      for (let n = 0; n < N; n++) {
        const angle = (2 * Math.PI * k * n) / N;
        real += data[n] * Math.cos(angle);
        imag -= data[n] * Math.sin(angle);
      }

      spectrum.push(Math.sqrt(real * real + imag * imag) / N);
    }

    return spectrum;
  }

  /**
   * Detect onsets from spectral flux using peak picking
   */
  private detectOnsets(flux: number[], sampleRate: number): Onset[] {
    const onsets: Onset[] = [];
    const timePerFrame = HOP_SIZE / sampleRate;

    // Calculate adaptive threshold
    const windowSize = 10;
    const multiplier = 1.5;

    for (let i = windowSize; i < flux.length - windowSize; i++) {
      // Calculate local mean
      let localMean = 0;
      for (let j = i - windowSize; j < i + windowSize; j++) {
        localMean += flux[j];
      }
      localMean /= windowSize * 2;

      // Check if current point is a local maximum above threshold
      const threshold = localMean * multiplier + 0.001;

      if (
        flux[i] > threshold &&
        flux[i] >= flux[i - 1] &&
        flux[i] >= flux[i + 1]
      ) {
        // Determine frequency band based on which part of spectrum had most energy
        const time = i * timePerFrame;
        const strength = Math.min(flux[i] / (localMean * 3 + 0.001), 1);
        const frequency = this.determineFrequencyBand();

        onsets.push({ time, strength, frequency });
      }
    }

    // Filter onsets that are too close together (minimum 50ms apart)
    return this.filterCloseOnsets(onsets, 0.05);
  }

  /**
   * Determine frequency band for onset (simplified)
   */
  private determineFrequencyBand(): 'low' | 'mid' | 'high' {
    // This is simplified - in a full implementation we'd look at
    // which frequency bands contributed most to the onset
    const rand = Math.random();
    if (rand < 0.4) return 'low';
    if (rand < 0.75) return 'mid';
    return 'high';
  }

  /**
   * Filter onsets that are too close together
   */
  private filterCloseOnsets(onsets: Onset[], minGap: number): Onset[] {
    if (onsets.length === 0) return [];

    const filtered: Onset[] = [onsets[0]];

    for (let i = 1; i < onsets.length; i++) {
      const prev = filtered[filtered.length - 1];
      if (onsets[i].time - prev.time >= minGap) {
        filtered.push(onsets[i]);
      } else if (onsets[i].strength > prev.strength) {
        // Replace with stronger onset
        filtered[filtered.length - 1] = onsets[i];
      }
    }

    return filtered;
  }

  /**
   * Detect BPM from onset times using autocorrelation
   */
  private detectBPM(onsets: Onset[]): number {
    if (onsets.length < 4) {
      return 120; // Default BPM
    }

    // Calculate inter-onset intervals
    const intervals: number[] = [];
    for (let i = 1; i < onsets.length; i++) {
      intervals.push(onsets[i].time - onsets[i - 1].time);
    }

    // Find most common interval in BPM range (60-200 BPM = 1.0 - 0.3 seconds)
    const bpmCandidates: Map<number, number> = new Map();

    for (const interval of intervals) {
      // Convert to BPM and round to nearest integer
      const bpm = Math.round(60 / interval);
      if (bpm >= 60 && bpm <= 200) {
        bpmCandidates.set(bpm, (bpmCandidates.get(bpm) ?? 0) + 1);
      }
      // Also check for half and double time
      const halfBpm = Math.round(30 / interval);
      if (halfBpm >= 60 && halfBpm <= 200) {
        bpmCandidates.set(halfBpm, (bpmCandidates.get(halfBpm) ?? 0) + 0.5);
      }
      const doubleBpm = Math.round(120 / interval);
      if (doubleBpm >= 60 && doubleBpm <= 200) {
        bpmCandidates.set(doubleBpm, (bpmCandidates.get(doubleBpm) ?? 0) + 0.5);
      }
    }

    // Find BPM with highest count
    let bestBpm = 120;
    let bestCount = 0;

    for (const [bpm, count] of bpmCandidates) {
      if (count > bestCount) {
        bestCount = count;
        bestBpm = bpm;
      }
    }

    return bestBpm;
  }

  /**
   * Calculate energy envelope for visualization
   */
  private calculateEnergy(
    samples: Float32Array,
    sampleRate: number
  ): number[] {
    const energy: number[] = [];
    const frameSize = Math.floor(sampleRate / 20); // 50ms frames

    for (let i = 0; i < samples.length; i += frameSize) {
      let sum = 0;
      const end = Math.min(i + frameSize, samples.length);
      for (let j = i; j < end; j++) {
        sum += samples[j] * samples[j];
      }
      energy.push(Math.sqrt(sum / (end - i)));
    }

    return energy;
  }

  /**
   * Get audio context for playback
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Resume audio context (needed after user interaction)
   */
  async resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.audioContext?.close();
    this.audioContext = null;
  }
}

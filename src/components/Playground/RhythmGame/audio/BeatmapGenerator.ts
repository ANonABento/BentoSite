/**
 * Beatmap Generator - Auto-generate beatmaps from audio analysis
 */

import {
  AudioAnalysis,
  Onset,
  BeatmapSettings,
  GeneratedBeatmap,
  GeneratedNote,
  RhythmGameMode,
} from './types';

const DEFAULT_SETTINGS: Record<BeatmapSettings['difficulty'], BeatmapSettings> = {
  easy: {
    difficulty: 'easy',
    noteSpacing: 400, // 400ms minimum between notes
    maxSimultaneous: 1,
  },
  medium: {
    difficulty: 'medium',
    noteSpacing: 200, // 200ms minimum
    maxSimultaneous: 2,
  },
  hard: {
    difficulty: 'hard',
    noteSpacing: 100, // 100ms minimum
    maxSimultaneous: 3,
  },
};

export class BeatmapGenerator {
  /**
   * Generate beatmap from audio analysis
   */
  generate(
    analysis: AudioAnalysis,
    audioBuffer: AudioBuffer,
    mode: RhythmGameMode,
    difficulty: 'easy' | 'medium' | 'hard',
    songName: string = 'Custom Song',
    artist: string = 'Unknown'
  ): GeneratedBeatmap {
    const settings = DEFAULT_SETTINGS[difficulty];
    const quantizedOnsets = this.quantizeOnsets(analysis.onsets, analysis.bpm);
    const filteredOnsets = this.filterOnsets(quantizedOnsets, settings);

    let notes: GeneratedNote[];

    switch (mode) {
      case 'osu':
        notes = this.generateOsuNotes(filteredOnsets, settings);
        break;
      case 'taiko':
        notes = this.generateTaikoNotes(filteredOnsets, settings);
        break;
      case 'mania':
        notes = this.generateManiaNotes(filteredOnsets, settings, 4);
        break;
      default:
        notes = this.generateOsuNotes(filteredOnsets, settings);
    }

    return {
      id: `custom-${Date.now()}`,
      name: songName,
      artist,
      bpm: analysis.bpm,
      duration: analysis.duration,
      difficulty,
      notes,
      audioBuffer,
    };
  }

  /**
   * Quantize onsets to the beat grid
   */
  private quantizeOnsets(onsets: Onset[], bpm: number): Onset[] {
    const beatDuration = 60 / bpm; // seconds per beat
    const quantizeGrid = beatDuration / 4; // 16th notes

    return onsets.map((onset) => ({
      ...onset,
      time: Math.round(onset.time / quantizeGrid) * quantizeGrid,
    }));
  }

  /**
   * Filter onsets based on difficulty settings
   */
  private filterOnsets(onsets: Onset[], settings: BeatmapSettings): Onset[] {
    const minGap = settings.noteSpacing / 1000; // Convert to seconds
    const filtered: Onset[] = [];

    // Sort by strength, then pick the best ones with minimum spacing
    const sorted = [...onsets].sort((a, b) => b.strength - a.strength);

    for (const onset of sorted) {
      // Check if this onset is far enough from existing ones
      const tooClose = filtered.some(
        (f) => Math.abs(f.time - onset.time) < minGap
      );

      if (!tooClose) {
        filtered.push(onset);
      }
    }

    // Sort back by time
    return filtered.sort((a, b) => a.time - b.time);
  }

  /**
   * Generate osu! style notes (circles at random positions)
   */
  private generateOsuNotes(
    onsets: Onset[],
    settings: BeatmapSettings
  ): GeneratedNote[] {
    const notes: GeneratedNote[] = [];
    let lastPosition = { x: 0.5, y: 0.5 };

    for (let i = 0; i < onsets.length; i++) {
      const onset = onsets[i];

      // Generate position with some movement constraint
      const angle = Math.random() * Math.PI * 2;
      const distance = 0.1 + Math.random() * 0.3;
      let x = lastPosition.x + Math.cos(angle) * distance;
      let y = lastPosition.y + Math.sin(angle) * distance;

      // Clamp to playfield
      x = Math.max(0.1, Math.min(0.9, x));
      y = Math.max(0.1, Math.min(0.9, y));

      // Occasionally add simultaneous notes on hard
      const addSimultaneous =
        settings.maxSimultaneous > 1 &&
        onset.strength > 0.7 &&
        Math.random() > 0.7;

      notes.push({
        id: `note-${i}`,
        time: onset.time * 1000, // Convert to ms
        x,
        y,
        type: 'tap',
      });

      if (addSimultaneous && settings.maxSimultaneous > 1) {
        notes.push({
          id: `note-${i}b`,
          time: onset.time * 1000,
          x: 1 - x, // Mirror position
          y,
          type: 'tap',
        });
      }

      lastPosition = { x, y };
    }

    return notes;
  }

  /**
   * Generate Taiko style notes (Don and Kat)
   */
  private generateTaikoNotes(
    onsets: Onset[],
    settings: BeatmapSettings
  ): GeneratedNote[] {
    const notes: GeneratedNote[] = [];

    for (let i = 0; i < onsets.length; i++) {
      const onset = onsets[i];

      // Low frequency = Don (center), High frequency = Kat (rim)
      const type =
        onset.frequency === 'low' || (onset.frequency === 'mid' && Math.random() > 0.4)
          ? 'drum-don'
          : 'drum-kat';

      notes.push({
        id: `note-${i}`,
        time: onset.time * 1000,
        x: 0, // Position doesn't matter for Taiko
        y: 0.5,
        type: type as 'drum-don' | 'drum-kat',
      });
    }

    return notes;
  }

  /**
   * Generate Mania style notes (falling in lanes)
   */
  private generateManiaNotes(
    onsets: Onset[],
    settings: BeatmapSettings,
    lanes: number
  ): GeneratedNote[] {
    const notes: GeneratedNote[] = [];
    const lastLaneUse = new Array(lanes).fill(-1000);

    for (let i = 0; i < onsets.length; i++) {
      const onset = onsets[i];
      const time = onset.time * 1000;

      // Choose lane based on frequency and avoid recently used lanes
      let preferredLane: number;
      if (onset.frequency === 'low') {
        preferredLane = Math.floor(Math.random() * (lanes / 2));
      } else if (onset.frequency === 'high') {
        preferredLane = Math.floor(lanes / 2 + Math.random() * (lanes / 2));
      } else {
        preferredLane = Math.floor(Math.random() * lanes);
      }

      // Try to avoid recently used lanes
      let lane = preferredLane;
      for (let attempt = 0; attempt < lanes; attempt++) {
        const testLane = (preferredLane + attempt) % lanes;
        if (time - lastLaneUse[testLane] >= settings.noteSpacing) {
          lane = testLane;
          break;
        }
      }

      lastLaneUse[lane] = time;

      notes.push({
        id: `note-${i}`,
        time,
        x: (lane + 0.5) / lanes, // Center of lane
        y: 0,
        lane,
        type: 'tap',
      });

      // Add simultaneous notes for strong beats on higher difficulties
      if (
        settings.maxSimultaneous > 1 &&
        onset.strength > 0.8 &&
        Math.random() > 0.6
      ) {
        const otherLane = (lane + Math.floor(lanes / 2)) % lanes;
        if (time - lastLaneUse[otherLane] >= settings.noteSpacing) {
          lastLaneUse[otherLane] = time;
          notes.push({
            id: `note-${i}b`,
            time,
            x: (otherLane + 0.5) / lanes,
            y: 0,
            lane: otherLane,
            type: 'tap',
          });
        }
      }
    }

    return notes.sort((a, b) => a.time - b.time);
  }

  /**
   * Add hold notes to existing beatmap (for harder difficulties)
   */
  addHoldNotes(notes: GeneratedNote[], bpm: number): GeneratedNote[] {
    const beatDuration = 60000 / bpm; // ms per beat
    const enhanced = [...notes];

    // Convert some taps to holds at regular intervals
    for (let i = 0; i < enhanced.length; i++) {
      if (
        enhanced[i].type === 'tap' &&
        i % 8 === 0 && // Every 8th note
        i + 1 < enhanced.length
      ) {
        const duration = Math.min(
          beatDuration * 2, // Max 2 beats
          enhanced[i + 1].time - enhanced[i].time - 50 // Don't overlap with next note
        );

        if (duration > beatDuration / 2) {
          enhanced[i] = {
            ...enhanced[i],
            type: 'hold',
            duration,
          };
        }
      }
    }

    return enhanced;
  }
}

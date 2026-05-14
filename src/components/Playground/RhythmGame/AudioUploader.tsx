'use client';

import { m } from 'framer-motion';
import { useState, useRef, useCallback } from 'react';
import { Upload, Music, Loader2, AlertCircle, X } from 'lucide-react';
import { useAudioAnalysis, RhythmGameMode } from './audio';
import { springs } from '../design';

interface AudioUploaderProps {
  mode: RhythmGameMode;
  onBeatmapGenerated: (beatmap: NonNullable<ReturnType<typeof useAudioAnalysis>['beatmap']>) => void;
  onCancel: () => void;
}

type BeatmapDifficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_OPTIONS: {
  value: BeatmapDifficulty;
  label: string;
  color: string;
}[] = [
  { value: 'easy', label: 'Easy', color: 'bg-[var(--pg-game-success)]' },
  { value: 'medium', label: 'Medium', color: 'bg-[var(--pg-accent-gold)]' },
  { value: 'hard', label: 'Hard', color: 'bg-[var(--pg-game-error)]' },
];

export function AudioUploader({ mode, onBeatmapGenerated, onCancel }: AudioUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [songName, setSongName] = useState('');
  const [artist, setArtist] = useState('');
  const [difficulty, setDifficulty] = useState<BeatmapDifficulty>('medium');
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isAnalyzing, analysis, error, analyzeFile } = useAudioAnalysis();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('audio/')) {
        setFile(droppedFile);
        setSongName(droppedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setSongName(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!file) return;

    const beatmap = await analyzeFile(file, mode, difficulty, songName || undefined, artist || undefined);
    if (beatmap) {
      onBeatmapGenerated(beatmap);
    }
  }, [file, mode, difficulty, songName, artist, analyzeFile, onBeatmapGenerated]);

  const handleDropzoneKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  }, []);

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={springs.gentle}
      className="w-full max-w-md"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-[var(--pg-text-primary)]">
          Upload Audio
        </h3>
        <m.button
          type="button"
          onClick={onCancel}
          aria-label="Cancel audio upload"
          className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-[var(--pg-text-muted)]"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <X className="w-5 h-5" />
        </m.button>
      </div>

      {/* File drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={handleDropzoneKeyDown}
        role="button"
        tabIndex={0}
        aria-label={file ? `Selected audio file ${file.name}. Press Enter to choose a different file.` : 'Upload audio file'}
        className={`
          relative p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all
          ${dragActive
            ? 'border-[var(--pg-accent-gold)] bg-[var(--pg-accent-gold)]/5'
            : file
              ? 'border-[var(--pg-game-success)]/50 bg-[var(--pg-game-success)]/5'
              : 'pg-surface-panel pg-border-soft hover:pg-border-strong'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center text-center">
          {file ? (
            <>
              <Music className="w-10 h-10 mb-3 text-[var(--pg-game-success)]" />
              <p className="text-sm font-medium text-[var(--pg-text-primary)] mb-1">
                {file.name}
              </p>
              <p className="text-xs text-[var(--pg-text-muted)]">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 mb-3 text-[var(--pg-text-muted)]" />
              <p className="text-sm text-[var(--pg-text-secondary)] mb-1">
                Drop an audio file here or click to browse
              </p>
              <p className="text-xs text-[var(--pg-text-muted)]">
                MP3, WAV, OGG supported
              </p>
            </>
          )}
        </div>
      </div>

      {/* Song info inputs */}
      {file && (
        <m.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 space-y-3"
        >
          <div>
            <label className="text-xs text-[var(--pg-text-muted)] uppercase tracking-wide">
              Song Name
            </label>
            <input
              aria-label="Song name"
              type="text"
              value={songName}
              onChange={(e) => setSongName(e.target.value)}
              className="pg-input w-full mt-1 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--pg-accent-gold)]/50"
              placeholder="Song name"
            />
          </div>

          <div>
            <label className="text-xs text-[var(--pg-text-muted)] uppercase tracking-wide">
              Artist
            </label>
            <input
              aria-label="Artist name"
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="pg-input w-full mt-1 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--pg-accent-gold)]/50"
              placeholder="Artist name"
            />
          </div>

          {/* Difficulty selector */}
          <div>
            <label className="text-xs text-[var(--pg-text-muted)] uppercase tracking-wide">
              Difficulty
            </label>
            <div className="flex gap-2 mt-1">
              {DIFFICULTY_OPTIONS.map((option) => (
                <m.button
                  type="button"
                  key={option.value}
                  onClick={() => setDifficulty(option.value)}
                  aria-label={`Set beatmap difficulty to ${option.label}`}
                  aria-pressed={difficulty === option.value}
                  className={`
                    flex-1 py-2 rounded-lg text-sm font-medium transition-all
                    ${difficulty === option.value
                      ? `${option.color} text-[var(--pg-text-on-accent)]`
                      : 'bg-[var(--pg-bg-elevated)] text-[var(--pg-text-secondary)] hover:bg-[var(--pg-bg-hover)]'
                    }
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {option.label}
                </m.button>
              ))}
            </div>
          </div>
        </m.div>
      )}

      {/* Analysis progress */}
      {isAnalyzing && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pg-surface-panel pg-border-soft mt-4 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-[var(--pg-accent-gold)] animate-spin" />
            <div>
              <p className="text-sm font-medium text-[var(--pg-text-primary)]">
                Analyzing audio...
              </p>
              <p className="text-xs text-[var(--pg-text-muted)]">
                Detecting BPM and generating beatmap
              </p>
            </div>
          </div>
        </m.div>
      )}

      {/* Analysis results preview */}
      {analysis && !isAnalyzing && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-4 rounded-xl bg-[var(--pg-bg-elevated)] border border-[var(--pg-game-success)]/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[var(--pg-game-success)]" />
            <span className="text-sm font-medium text-[var(--pg-text-primary)]">
              Analysis Complete
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-mono font-bold text-[var(--pg-accent-gold)]">
                {analysis.bpm}
              </p>
              <p className="text-xs text-[var(--pg-text-muted)]">BPM</p>
            </div>
            <div>
              <p className="text-2xl font-mono font-bold text-[var(--purple)]">
                {Math.round(analysis.duration)}s
              </p>
              <p className="text-xs text-[var(--pg-text-muted)]">Duration</p>
            </div>
            <div>
              <p className="text-2xl font-mono font-bold text-[var(--pg-game-success)]">
                {analysis.onsets.length}
              </p>
              <p className="text-xs text-[var(--pg-text-muted)]">Notes</p>
            </div>
          </div>
        </m.div>
      )}

      {/* Error message */}
      {error && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-4 rounded-xl bg-[var(--pg-game-error)]/10 border border-[var(--pg-game-error)]/30"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[var(--pg-game-error)]" />
            <p className="text-sm text-[var(--pg-game-error)]">{error}</p>
          </div>
        </m.div>
      )}

      {/* Action button */}
      <m.button
        type="button"
        onClick={handleAnalyze}
        disabled={!file || isAnalyzing}
        aria-label={isAnalyzing ? 'Analyzing audio file' : 'Generate beatmap from selected audio'}
        className={`
          w-full mt-6 py-3 rounded-xl font-medium transition-all
          ${!file || isAnalyzing
            ? 'bg-white/5 text-[var(--pg-text-muted)] cursor-not-allowed'
            : 'bg-[var(--pg-accent-gold)] text-black hover:bg-[var(--pg-accent-gold-hover)]'
          }
        `}
        whileHover={file && !isAnalyzing ? { scale: 1.01 } : {}}
        whileTap={file && !isAnalyzing ? { scale: 0.99 } : {}}
      >
        {isAnalyzing ? 'Analyzing...' : 'Generate Beatmap'}
      </m.button>
    </m.div>
  );
}

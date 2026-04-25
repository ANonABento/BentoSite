export interface RhythmEngineActiveNote<TRating extends string> {
  id: string;
  time: number;
  spawnTime: number;
  hit: boolean;
  rating?: TRating;
}

export interface RhythmEngineState<
  TNote extends RhythmEngineActiveNote<TRating>,
  TRating extends string,
  TModeState
> {
  activeNotes: TNote[];
  score: number;
  combo: number;
  maxCombo: number;
  ratingCounts: Record<TRating, number>;
  modeState: TModeState;
}

export interface RhythmEnginePatch<TNote, TModeState> {
  notePatch?: Partial<TNote>;
  modeStatePatch?: Partial<TModeState>;
}

export interface RhythmEngineConfig<
  TSourceNote extends { id: string; time: number },
  TNote extends RhythmEngineActiveNote<TRating>,
  TRating extends string,
  TInput,
  TModeState extends object,
  TResult
> {
  beatMap: {
    duration: number;
    notes: TSourceNote[];
  };
  approachTime: number;
  noteCleanupMs: number;
  ratings: readonly TRating[];
  missRating: TRating;
  hitWindows: Array<{
    rating: TRating;
    window: number;
  }>;
  scoring: Record<TRating, number>;
  accuracyWeights: Record<TRating, number>;
  createNote: (note: TSourceNote, spawnTime: number) => TNote;
  createInitialModeState: () => TModeState;
  getComboMultiplier: (combo: number) => number;
  matchNote: (note: TNote, input: TInput) => boolean;
  getScoreGain?: (args: {
    input: TInput;
    note: TNote;
    rating: TRating;
    baseScore: number;
  }) => number;
  onHit?: (args: {
    input: TInput;
    note: TNote;
    rating: TRating;
    elapsed: number;
    modeState: TModeState;
  }) => RhythmEnginePatch<TNote, TModeState> | void;
  onNoHit?: (args: {
    input: TInput;
    elapsed: number;
    modeState: TModeState;
  }) => Partial<TModeState> | void;
  onMiss?: (args: {
    note: TNote;
    elapsed: number;
    modeState: TModeState;
  }) => RhythmEnginePatch<TNote, TModeState> | void;
  onTick?: (args: {
    elapsed: number;
    modeState: TModeState;
  }) => Partial<TModeState> | void;
  buildResult: (args: {
    score: number;
    maxCombo: number;
    ratingCounts: Record<TRating, number>;
    accuracy: number;
  }) => TResult;
}

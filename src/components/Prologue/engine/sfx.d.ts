export interface Sfx {
  readonly on: boolean;
  setOn(on: boolean): void;
  play(name: 'wake' | 'servo' | 'fine' | 'lock' | 'squeak' | 'click' | 'degauss'): void;
  /** Play every [time, name] cue crossed going forward from `prev` to `t`. */
  cue(prev: number, t: number, cues: [number, string][]): void;
}

/** `base`: where the clips are served (default '/prologue/sfx/'). */
export function createSfx(opts?: { base?: string }): Sfx;

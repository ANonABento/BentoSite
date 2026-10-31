export interface Sfx {
  readonly on: boolean;
  setOn(on: boolean): void;
  play(name: 'wake' | 'servo' | 'lock' | 'squeak' | 'click' | 'degauss'): void;
  /** Play every [time, name] cue crossed going forward from `prev` to `t`. */
  cue(prev: number, t: number, cues: [number, string][]): void;
}

export function createSfx(): Sfx;

import type { Sfx } from './sfx';

/** The board as the in-TV boot draws it: the tile's size in cells and each card's place. */
export interface PrologueBoard {
  cols: number;
  rows: number;
  cards: {
    id: string;
    col: number;
    row: number;
    w: number;
    h: number;
    title?: string;
    category?: string;
    desc?: string;
    image?: string;
    variant?: string | null;
  }[];
}

/** The values tuned by eye (see TUNE in prologue.js); saved in src/components/Prologue/tuning.json. */
export interface PrologueTuning {
  timing?: { click?: number; pullBack?: number };
  camera?: { glass?: number[]; fov?: number; via1?: number[]; via2?: number[] };
  poses?: { handsUp?: number[]; showCloth?: number[]; pocket?: number[]; bow?: number[] };
  headdress?: { roll?: number; yaw?: number };
  eyes?: { cold?: string; warm?: string; coldGlow?: number; warmGlow?: number };
  light?: { darkGlass?: number; ambient?: number; rim?: number; bloom?: number };
}

export interface PrologueOptions {
  /** The element the canvas and the sound button go in. */
  container: HTMLElement;
  robotUrl: string;
  board?: PrologueBoard;
  boardUrl?: string;
  /** For the boot text; defaults to the board's titled cards. */
  projectCount?: number;
  /** Prefix for card image paths. */
  assetBase?: string;
  /** CSS font families for the canvas text (defaults: Orbitron, VT323, "Instrument Sans"). */
  fonts?: { display?: string; mono?: string; sans?: string };
  sfx?: Sfx;
  tuning?: PrologueTuning;
  /** Boot time (T scale) at which `onHandoff` fires; defaults to the start of the pixel merge. */
  handoffAt?: number;
  onHandoff?: () => void;
  /** Prototype only: tuning GUI and keys, debug globals, bone probe, open paused at a time. */
  gui?: boolean;
  debug?: boolean;
  probe?: boolean;
  startAt?: number | null;
}

export interface PrologueControls {
  sfx: Sfx;
  /** The live tuned values, and a setter that applies edits at once (the click time and glass shot need a restart). */
  tuning: Required<PrologueTuning>;
  setTuning(partial: PrologueTuning): void;
  /** Jump straight to the handoff. */
  skip(): void;
  /** Stop, free the GPU and remove everything it added to the container. */
  dispose(): void;
}

export function startPrologue(opts: PrologueOptions): Promise<PrologueControls>;

'use client';

import { useEffect, useRef, useState } from 'react';
import type { PrologueBoard, PrologueControls } from './engine/prologue';
import tuning from './tuning.json';

/*
 * The prologue plays over the page before the board: a robot maid wakes in a dark CRT's reflection, tidies up,
 * wipes the glass and switches the TV on; the camera dives into the screen. At the dive it hands off: the board
 * mounts underneath (its own boot runs) and this fades out. Desktop gets the live 3D scene (engine/), phones a
 * recording of it. Esc, Enter or the Skip button hand off at once; any failure (no WebGL, a missing file) does too.
 */

export type PrologueMode = 'scene' | 'video' | 'none';

const ROBOT_URL = '/prologue/robot-maid.glb';
const VIDEO_URL = '/prologue/prologue.mp4';
const FADE_MS = 600;

/** Which prologue this visit gets. Only called when the visit gets the boot at all (see TrayFill's shouldBoot). */
export function prologueMode(): PrologueMode {
  const q = new URLSearchParams(window.location.search);
  if (q.has('noprologue')) return 'none';
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return 'none';
  const desktop = window.matchMedia('(pointer: fine)').matches && window.innerWidth >= 900 && window.innerHeight >= 560;
  if (!desktop) return 'video';
  try {
    return document.createElement('canvas').getContext('webgl2') ? 'scene' : 'video';
  } catch {
    return 'video';
  }
}

interface PrologueProps {
  mode: Exclude<PrologueMode, 'none'>;
  board: PrologueBoard;
  projectCount: number;
  /** The board should mount now (it boots under the fading prologue). */
  onHandoff: () => void;
  /** The fade is over; unmount. */
  onDone: () => void;
}

export function Prologue({ mode, board, projectCount, onHandoff, onDone }: PrologueProps) {
  const stage = useRef<HTMLDivElement>(null);
  const controls = useRef<PrologueControls | null>(null);
  const [leaving, setLeaving] = useState(false);
  // Latest callbacks, so the effects below run once.
  const cb = useRef({ onHandoff, onDone });
  useEffect(() => {
    cb.current = { onHandoff, onDone };
  });

  const leave = useRef(() => {});
  useEffect(() => {
    let gone = false;
    leave.current = () => {
      if (gone) return;
      gone = true;
      setLeaving(true);
      cb.current.onHandoff();
      window.setTimeout(() => cb.current.onDone(), FADE_MS);
    };
  }, []);

  // The live scene.
  useEffect(() => {
    if (mode !== 'scene' || !stage.current) return;
    let cancelled = false;
    const css = getComputedStyle(document.documentElement);
    const family = (v: string, fallback: string) => css.getPropertyValue(v).trim() || fallback;
    // Nothing on screen within 10 s (a slow network or GPU): go straight to the board.
    const watchdog = window.setTimeout(() => !controls.current && leave.current(), 10000);
    import('./engine/prologue.js')
      .then(({ startPrologue }) =>
        startPrologue({
          container: stage.current!,
          robotUrl: ROBOT_URL,
          tuning,
          board,
          projectCount,
          fonts: {
            display: family('--font-orbitron', 'Orbitron'),
            mono: family('--font-vt323', 'VT323'),
            sans: family('--font-instrument', 'sans-serif'),
          },
          onHandoff: () => leave.current(),
        }),
      )
      .then((c) => {
        if (cancelled) c.dispose();
        else controls.current = c;
      })
      .catch((e) => {
        console.warn('prologue', e);
        leave.current();
      });
    return () => {
      cancelled = true;
      window.clearTimeout(watchdog);
      controls.current?.dispose();
      controls.current = null;
    };
    // board and projectCount are fixed for the page's life
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Skip keys. The board isn't mounted yet, so nothing else wants them.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') leave.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      ref={stage}
      className="prologue"
      data-leaving={leaving || undefined}
      style={{ transitionDuration: `${FADE_MS}ms` }}
      aria-label="Intro animation"
      role="presentation"
    >
      {mode === 'video' && (
        <video
          className="prologue-video"
          src={VIDEO_URL}
          autoPlay
          muted
          playsInline
          onEnded={() => leave.current()}
          onError={() => leave.current()}
        />
      )}
      <button type="button" className="prologue-skip" onClick={() => leave.current()}>
        SKIP ›
      </button>
    </div>
  );
}

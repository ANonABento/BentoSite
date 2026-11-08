'use client';

import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import type { PrologueBoard, PrologueControls } from './engine/prologue';
import theatreState from './theatre-state.json';

/*
 * The prologue plays over the page before the board: a robot maid wakes in a dark CRT's reflection, tidies up,
 * wipes the glass and switches the TV on; the camera dives into the screen. At the dive it hands off: the board
 * mounts underneath (its own boot runs) and this fades out. Desktop gets the live 3D scene (engine/), phones a
 * recording of it. Esc, Enter or the Skip button hand off at once; so does a failure (no WebGL, or a file that still
 * won't load after its retries), which is logged to the console with the file's name.
 */

export type PrologueMode = 'scene' | 'video' | 'none';

const ROBOT_URL = '/prologue/robot-maid.glb';
const VIDEO_URL = '/prologue/prologue.mp4';
const FADE_MS = 600;
/** Nothing on screen by then (a slow network or GPU): go to the board. Room for the downloads' retries (engine/net.js). */
const WATCHDOG_MS = 30000;
/** Tries for the engine's code chunk and the phone video, and the backoff between them. */
const TRIES = 3;
const backoff = (attempt: number) => 600 * 2 ** attempt;
const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
const describe = (e: unknown) => (e instanceof Error ? `${e.name}: ${e.message}` : String(e));

/** The engine's chunk (three.js and Theatre.js come with it), retried: a dropped chunk shouldn't skip the scene. */
async function loadEngine() {
  for (let i = 0; ; i++) {
    try {
      return await import('./engine/prologue.js');
    } catch (e) {
      if (i + 1 >= TRIES) throw e;
      console.warn(`[prologue] engine code: try ${i + 1}/${TRIES} failed (${describe(e)})`);
      await wait(backoff(i));
    }
  }
}

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
  const videoTries = useRef(0);
  useEffect(() => {
    let gone = false;
    leave.current = () => {
      if (gone) return;
      gone = true;
      setLeaving(true);
      document.documentElement.classList.remove('prologue-pending');
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
    // Nothing on screen in time (a slow network or GPU): go straight to the board, and say so.
    const watchdog = window.setTimeout(() => {
      if (controls.current) return;
      console.warn(`[prologue] still loading after ${WATCHDOG_MS / 1000} s; going to the board`);
      leave.current();
    }, WATCHDOG_MS);
    loadEngine()
      .then(({ startPrologue }) =>
        startPrologue({
          container: stage.current!,
          robotUrl: ROBOT_URL,
          theatreState,
          board,
          projectCount,
          fonts: {
            display: family('--font-orbitron', 'Orbitron'),
            mono: family('--font-vt323', 'VT323'),
            sans: family('--font-instrument', 'sans-serif'),
          },
          onHandoff: () => leave.current(),
          // ?debug: the engine logs its load timings ([prologue] start / robot-loaded / compiled / first-frame).
          debug: new URLSearchParams(window.location.search).has('debug'),
        }),
      )
      .then((c) => {
        if (cancelled) c.dispose();
        else {
          controls.current = c;
          document.documentElement.classList.remove('prologue-pending');
        }
      })
      .catch((e) => {
        // Only once every retry is spent (engine/net.js logs each try). StrictMode's throwaway run doesn't count.
        if (cancelled) return;
        console.warn(`[prologue] falling back to the board: ${describe(e)}`, e);
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

  // The phone video: a failed load is retried with backoff before giving up on it.
  const onVideoError = (e: SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const why = video.error ? `MediaError ${video.error.code}${video.error.message ? `: ${video.error.message}` : ''}` : 'error';
    const attempt = videoTries.current++;
    if (attempt + 1 >= TRIES) {
      console.warn(`[prologue] ${VIDEO_URL} failed after ${TRIES} tries (${why}); falling back to the board`);
      leave.current();
      return;
    }
    console.warn(`[prologue] ${VIDEO_URL}: try ${attempt + 1}/${TRIES} failed (${why})`);
    window.setTimeout(() => {
      video.load();
      video.play().catch(() => {});
    }, backoff(attempt));
  };

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
          onError={onVideoError}
        />
      )}
      <button type="button" className="prologue-skip" onClick={() => leave.current()}>
        SKIP ›
      </button>
    </div>
  );
}

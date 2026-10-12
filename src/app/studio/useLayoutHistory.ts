'use client';

import { useCallback, useRef, useState } from 'react';
import type { BoardLayout } from '@/components/BentoGrid';

/** How long edits with the same key (a slider drag, a focal-point drag) fold into one undo step. */
const COALESCE_MS = 800;

/** The studio's layout with undo and redo, and whether it differs from what's saved. */
export function useLayoutHistory(initial: BoardLayout) {
  const [state, setState] = useState({ past: [] as BoardLayout[], present: initial, future: [] as BoardLayout[] });
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const last = useRef<{ key: string; at: number } | null>(null);

  /** Apply an edit. Edits sharing `key` within a moment replace each other instead of stacking. */
  const commit = useCallback((next: BoardLayout, key?: string) => {
    const now = Date.now();
    const fold = key !== undefined && last.current?.key === key && now - last.current.at < COALESCE_MS;
    last.current = key === undefined ? null : { key, at: now };
    setState((s) => ({ past: fold ? s.past : [...s.past, s.present], present: next, future: [] }));
  }, []);

  const undo = useCallback(() => {
    last.current = null;
    setState((s) => (s.past.length ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] } : s));
  }, []);

  const redo = useCallback(() => {
    last.current = null;
    setState((s) => (s.future.length ? { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) } : s));
  }, []);

  const markSaved = useCallback((layout: BoardLayout) => setSaved(JSON.stringify(layout)), []);

  return {
    layout: state.present,
    commit,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    dirty: JSON.stringify(state.present) !== saved,
    markSaved,
  };
}

// Tests for layout transitions
import { describe, it, expect } from 'vitest';
import {
  categorizeTransition,
  hasTransitionChanges,
  hasPositionChanges,
  emptyTransition,
} from '../layout/transitions';
import type { CardLayout } from '../InfiniteGrid.types';

const createLayout = (id: string, x = 0, y = 0): CardLayout => ({
  id,
  x,
  y,
  width: 200,
  height: 200,
  size: '1x1',
});

describe('categorizeTransition', () => {
  it('identifies kept cards', () => {
    const oldLayouts = new Map([
      ['a', createLayout('a')],
      ['b', createLayout('b')],
    ]);
    const newLayouts = new Map([
      ['a', createLayout('a')],
      ['b', createLayout('b')],
    ]);

    const result = categorizeTransition(oldLayouts, newLayouts);

    expect(result.kept.has('a')).toBe(true);
    expect(result.kept.has('b')).toBe(true);
    expect(result.removed.size).toBe(0);
    expect(result.added.size).toBe(0);
  });

  it('identifies removed cards', () => {
    const oldLayouts = new Map([
      ['a', createLayout('a')],
      ['b', createLayout('b')],
    ]);
    const newLayouts = new Map([['a', createLayout('a')]]);

    const result = categorizeTransition(oldLayouts, newLayouts);

    expect(result.kept.has('a')).toBe(true);
    expect(result.removed.has('b')).toBe(true);
    expect(result.added.size).toBe(0);
  });

  it('identifies added cards', () => {
    const oldLayouts = new Map([['a', createLayout('a')]]);
    const newLayouts = new Map([
      ['a', createLayout('a')],
      ['c', createLayout('c')],
    ]);

    const result = categorizeTransition(oldLayouts, newLayouts);

    expect(result.kept.has('a')).toBe(true);
    expect(result.removed.size).toBe(0);
    expect(result.added.has('c')).toBe(true);
  });

  it('handles complete replacement', () => {
    const oldLayouts = new Map([
      ['a', createLayout('a')],
      ['b', createLayout('b')],
    ]);
    const newLayouts = new Map([
      ['c', createLayout('c')],
      ['d', createLayout('d')],
    ]);

    const result = categorizeTransition(oldLayouts, newLayouts);

    expect(result.kept.size).toBe(0);
    expect(result.removed.size).toBe(2);
    expect(result.added.size).toBe(2);
  });

  it('handles empty to populated', () => {
    const oldLayouts = new Map<string, CardLayout>();
    const newLayouts = new Map([['a', createLayout('a')]]);

    const result = categorizeTransition(oldLayouts, newLayouts);

    expect(result.kept.size).toBe(0);
    expect(result.removed.size).toBe(0);
    expect(result.added.has('a')).toBe(true);
  });

  it('handles populated to empty', () => {
    const oldLayouts = new Map([['a', createLayout('a')]]);
    const newLayouts = new Map<string, CardLayout>();

    const result = categorizeTransition(oldLayouts, newLayouts);

    expect(result.kept.size).toBe(0);
    expect(result.removed.has('a')).toBe(true);
    expect(result.added.size).toBe(0);
  });
});

describe('hasTransitionChanges', () => {
  it('returns false for no changes', () => {
    const transition = {
      kept: new Set(['a', 'b']),
      removed: new Set<string>(),
      added: new Set<string>(),
    };
    expect(hasTransitionChanges(transition)).toBe(false);
  });

  it('returns true when cards removed', () => {
    const transition = {
      kept: new Set(['a']),
      removed: new Set(['b']),
      added: new Set<string>(),
    };
    expect(hasTransitionChanges(transition)).toBe(true);
  });

  it('returns true when cards added', () => {
    const transition = {
      kept: new Set(['a']),
      removed: new Set<string>(),
      added: new Set(['c']),
    };
    expect(hasTransitionChanges(transition)).toBe(true);
  });
});

describe('hasPositionChanges', () => {
  it('returns false when positions unchanged', () => {
    const oldLayouts = new Map([['a', createLayout('a', 100, 200)]]);
    const newLayouts = new Map([['a', createLayout('a', 100, 200)]]);

    expect(hasPositionChanges(oldLayouts, newLayouts)).toBe(false);
  });

  it('returns true when position changed', () => {
    const oldLayouts = new Map([['a', createLayout('a', 100, 200)]]);
    const newLayouts = new Map([['a', createLayout('a', 150, 200)]]);

    expect(hasPositionChanges(oldLayouts, newLayouts)).toBe(true);
  });

  it('ignores changes below threshold', () => {
    const oldLayouts = new Map([['a', createLayout('a', 100, 200)]]);
    const newLayouts = new Map([['a', createLayout('a', 100.5, 200)]]);

    expect(hasPositionChanges(oldLayouts, newLayouts, 1)).toBe(false);
  });

  it('ignores new cards', () => {
    const oldLayouts = new Map([['a', createLayout('a', 100, 200)]]);
    const newLayouts = new Map([
      ['a', createLayout('a', 100, 200)],
      ['b', createLayout('b', 300, 400)],
    ]);

    expect(hasPositionChanges(oldLayouts, newLayouts)).toBe(false);
  });
});

describe('emptyTransition', () => {
  it('returns transition with empty sets', () => {
    const result = emptyTransition();
    expect(result.kept.size).toBe(0);
    expect(result.removed.size).toBe(0);
    expect(result.added.size).toBe(0);
  });
});

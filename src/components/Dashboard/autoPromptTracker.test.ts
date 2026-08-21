import { beforeEach, describe, expect, it } from 'vitest';
import { claimAutoPrompt, resetAutoPromptTracker } from './autoPromptTracker';

/**
 * The dashboard sends the chat a "Tell me about <project>" rundown on a
 * `?project=` deep link. This is the guard that keeps it to one: React Strict
 * Mode remounts the dashboard in development, and the tracker it replaced was
 * a per-instance ref, so the rundown went out twice.
 */

beforeEach(() => {
  resetAutoPromptTracker();
});

describe('claimAutoPrompt', () => {
  it('grants the first claim on a project', () => {
    expect(claimAutoPrompt('choomfie')).toBe(true);
  });

  it('refuses every claim after the first — the Strict Mode remount case', () => {
    expect(claimAutoPrompt('choomfie')).toBe(true);
    expect(claimAutoPrompt('choomfie')).toBe(false);
    expect(claimAutoPrompt('choomfie')).toBe(false);
  });

  it('tracks projects independently', () => {
    expect(claimAutoPrompt('choomfie')).toBe(true);
    expect(claimAutoPrompt('bentosite')).toBe(true);
    expect(claimAutoPrompt('choomfie')).toBe(false);
    expect(claimAutoPrompt('bentosite')).toBe(false);
  });

  it('survives across callers, so clearing the chat does not re-trigger it', () => {
    claimAutoPrompt('slothing');
    // A later render asking again is the same as the chat being cleared and
    // the effect re-evaluating: still no second rundown.
    expect(claimAutoPrompt('slothing')).toBe(false);
  });
});

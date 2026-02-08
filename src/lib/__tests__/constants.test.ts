import { describe, it, expect } from 'vitest';
import { TIMEOUTS, ANIMATION_DURATIONS } from '../constants';

describe('constants', () => {
  describe('TIMEOUTS', () => {
    it('should export CHAT_REQUEST timeout', () => {
      expect(TIMEOUTS.CHAT_REQUEST).toBe(30000);
      expect(typeof TIMEOUTS.CHAT_REQUEST).toBe('number');
    });

    it('should export CLIPBOARD_FEEDBACK duration', () => {
      expect(TIMEOUTS.CLIPBOARD_FEEDBACK).toBe(2000);
    });

    it('should export TOAST_DURATION', () => {
      expect(TIMEOUTS.TOAST_DURATION).toBe(3000);
    });

    it('should have reasonable timeout values (> 0 and < 1 minute)', () => {
      Object.values(TIMEOUTS).forEach((timeout) => {
        expect(timeout).toBeGreaterThan(0);
        expect(timeout).toBeLessThanOrEqual(60000);
      });
    });
  });

  describe('ANIMATION_DURATIONS', () => {
    it('should export FAST duration', () => {
      expect(ANIMATION_DURATIONS.FAST).toBe(150);
    });

    it('should export NORMAL duration', () => {
      expect(ANIMATION_DURATIONS.NORMAL).toBe(200);
    });

    it('should export SLOW duration', () => {
      expect(ANIMATION_DURATIONS.SLOW).toBe(300);
    });

    it('should export TAB_SWITCH duration', () => {
      expect(ANIMATION_DURATIONS.TAB_SWITCH).toBe(150);
    });

    it('should have durations in ascending order (FAST < NORMAL < SLOW)', () => {
      expect(ANIMATION_DURATIONS.FAST).toBeLessThan(ANIMATION_DURATIONS.NORMAL);
      expect(ANIMATION_DURATIONS.NORMAL).toBeLessThan(ANIMATION_DURATIONS.SLOW);
    });

    it('should have reasonable animation values (> 0 and < 1 second)', () => {
      Object.values(ANIMATION_DURATIONS).forEach((duration) => {
        expect(duration).toBeGreaterThan(0);
        expect(duration).toBeLessThanOrEqual(1000);
      });
    });
  });
});

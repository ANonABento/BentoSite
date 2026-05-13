import { describe, it, expect } from 'vitest';
import {
  TIMEOUTS,
  ANIMATION_DURATIONS,
  BREAKPOINTS,
  DEFAULTS,
  PERFORMANCE,
  ZOOM_LIMITS,
  STORAGE_KEYS,
  Z_INDEX,
  API_ENDPOINTS,
} from '../constants';

describe('constants', () => {
  describe('BREAKPOINTS', () => {
    it('should export standard breakpoint values', () => {
      expect(BREAKPOINTS.SM).toBe(640);
      expect(BREAKPOINTS.MD).toBe(768);
      expect(BREAKPOINTS.LG).toBe(1024);
      expect(BREAKPOINTS.XL).toBe(1280);
      expect(BREAKPOINTS['2XL']).toBe(1536);
    });

    it('should have breakpoints in ascending order', () => {
      expect(BREAKPOINTS.SM).toBeLessThan(BREAKPOINTS.MD);
      expect(BREAKPOINTS.MD).toBeLessThan(BREAKPOINTS.LG);
      expect(BREAKPOINTS.LG).toBeLessThan(BREAKPOINTS.XL);
      expect(BREAKPOINTS.XL).toBeLessThan(BREAKPOINTS['2XL']);
    });
  });

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

    it('should export SEARCH_DEBOUNCE', () => {
      expect(TIMEOUTS.SEARCH_DEBOUNCE).toBe(300);
    });

    it('should export LOADING_DELAY', () => {
      expect(TIMEOUTS.LOADING_DELAY).toBe(150);
    });

    it('should have reasonable timeout values (> 0 and < 1 minute)', () => {
      Object.values(TIMEOUTS).forEach((timeout) => {
        expect(timeout).toBeGreaterThan(0);
        expect(timeout).toBeLessThanOrEqual(60000);
      });
    });
  });

  describe('ANIMATION_DURATIONS', () => {
    it('should export INSTANT duration', () => {
      expect(ANIMATION_DURATIONS.INSTANT).toBe(0);
    });

    it('should export FAST duration', () => {
      expect(ANIMATION_DURATIONS.FAST).toBe(150);
    });

    it('should export NORMAL duration', () => {
      expect(ANIMATION_DURATIONS.NORMAL).toBe(200);
    });

    it('should export SLOW duration', () => {
      expect(ANIMATION_DURATIONS.SLOW).toBe(300);
    });

    it('should export DRAMATIC duration', () => {
      expect(ANIMATION_DURATIONS.DRAMATIC).toBe(500);
    });

    it('should export TAB_SWITCH duration', () => {
      expect(ANIMATION_DURATIONS.TAB_SWITCH).toBe(150);
    });

    it('should have durations in ascending order (INSTANT < FAST < NORMAL < SLOW < DRAMATIC)', () => {
      expect(ANIMATION_DURATIONS.INSTANT).toBeLessThan(ANIMATION_DURATIONS.FAST);
      expect(ANIMATION_DURATIONS.FAST).toBeLessThan(ANIMATION_DURATIONS.NORMAL);
      expect(ANIMATION_DURATIONS.NORMAL).toBeLessThan(ANIMATION_DURATIONS.SLOW);
      expect(ANIMATION_DURATIONS.SLOW).toBeLessThan(ANIMATION_DURATIONS.DRAMATIC);
    });
  });

  describe('DEFAULTS', () => {
    it('should export window size defaults', () => {
      expect(DEFAULTS.WINDOW_WIDTH).toBe(1920);
      expect(DEFAULTS.WINDOW_HEIGHT).toBe(1080);
    });

    it('should export MAX_CHAT_MESSAGES', () => {
      expect(DEFAULTS.MAX_CHAT_MESSAGES).toBe(50);
    });

    it('should export FPS_THRESHOLD', () => {
      expect(DEFAULTS.FPS_THRESHOLD).toBe(30);
    });
  });

  describe('PERFORMANCE', () => {
    it('should export LOW_FPS_THRESHOLD', () => {
      expect(PERFORMANCE.LOW_FPS_THRESHOLD).toBe(30);
    });

    it('should export MOBILE_MAX_PIXEL_RATIO', () => {
      expect(PERFORMANCE.MOBILE_MAX_PIXEL_RATIO).toBe(1.5);
    });

    it('should export LOD thresholds for desktop', () => {
      expect(PERFORMANCE.LOD_DESKTOP.HIGH_DETAIL).toBe(10);
      expect(PERFORMANCE.LOD_DESKTOP.MEDIUM_DETAIL).toBe(20);
    });

    it('should export LOD thresholds for mobile', () => {
      expect(PERFORMANCE.LOD_MOBILE.HIGH_DETAIL).toBe(5);
      expect(PERFORMANCE.LOD_MOBILE.MEDIUM_DETAIL).toBe(10);
    });

    it('should have mobile LOD be more aggressive than desktop', () => {
      expect(PERFORMANCE.LOD_MOBILE.HIGH_DETAIL).toBeLessThan(PERFORMANCE.LOD_DESKTOP.HIGH_DETAIL);
      expect(PERFORMANCE.LOD_MOBILE.MEDIUM_DETAIL).toBeLessThan(PERFORMANCE.LOD_DESKTOP.MEDIUM_DETAIL);
    });
  });

  describe('ZOOM_LIMITS', () => {
    it('should export desktop zoom limits', () => {
      expect(ZOOM_LIMITS.DESKTOP.MIN_DISTANCE).toBe(3);
      expect(ZOOM_LIMITS.DESKTOP.MAX_DISTANCE).toBe(30);
    });

    it('should export mobile zoom limits', () => {
      expect(ZOOM_LIMITS.MOBILE.MIN_DISTANCE).toBe(4);
      expect(ZOOM_LIMITS.MOBILE.MAX_DISTANCE).toBe(40);
    });
  });

  describe('STORAGE_KEYS', () => {
    it('should export storage key strings', () => {
      expect(typeof STORAGE_KEYS.CHAT_HISTORY).toBe('string');
      expect(typeof STORAGE_KEYS.HIGH_SCORES).toBe('string');
      expect(typeof STORAGE_KEYS.PREFERENCES).toBe('string');
    });
  });

  describe('Z_INDEX', () => {
    it('should export z-index scale', () => {
      expect(Z_INDEX.BASE).toBe(0);
      expect(Z_INDEX.ELEVATED).toBe(10);
      expect(Z_INDEX.MODAL).toBe(60);
      expect(Z_INDEX.TOAST).toBe(90);
    });

    it('should have z-index values in ascending order', () => {
      expect(Z_INDEX.BASE).toBeLessThan(Z_INDEX.ELEVATED);
      expect(Z_INDEX.ELEVATED).toBeLessThan(Z_INDEX.DROPDOWN);
      expect(Z_INDEX.DROPDOWN).toBeLessThan(Z_INDEX.STICKY);
      expect(Z_INDEX.STICKY).toBeLessThan(Z_INDEX.FIXED);
      expect(Z_INDEX.FIXED).toBeLessThan(Z_INDEX.OVERLAY);
      expect(Z_INDEX.OVERLAY).toBeLessThan(Z_INDEX.MODAL);
      expect(Z_INDEX.MODAL).toBeLessThan(Z_INDEX.POPOVER);
      expect(Z_INDEX.POPOVER).toBeLessThan(Z_INDEX.TOOLTIP);
      expect(Z_INDEX.TOOLTIP).toBeLessThan(Z_INDEX.TOAST);
    });
  });

  describe('API_ENDPOINTS', () => {
    it('should export API endpoint paths', () => {
      expect(API_ENDPOINTS.CHAT).toBe('/api/chat');
    });
  });
});

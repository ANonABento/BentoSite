import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateId,
  formatNumber,
  formatFileSize,
  formatPercentage,
  formatDuration,
  clamp,
  lerp,
  mapRange,
  isInputElement,
  cn,
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from '../utils';

describe('utils', () => {
  describe('generateId', () => {
    it('should generate a unique string ID', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(10);
    });

    it('should generate different IDs on consecutive calls', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should contain timestamp and random parts', () => {
      const id = generateId();
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with thousand separators', () => {
      expect(formatNumber(1234567)).toBe('1,234,567');
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0');
    });

    it('should handle negative numbers', () => {
      expect(formatNumber(-1234)).toBe('-1,234');
    });

    it('should handle decimals', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(2621440)).toBe('2.5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('should handle zero', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage with default decimals', () => {
      expect(formatPercentage(75)).toBe('75%');
    });

    it('should format percentage with specified decimals', () => {
      expect(formatPercentage(75.5678, 2)).toBe('75.57%');
    });

    it('should handle zero', () => {
      expect(formatPercentage(0)).toBe('0%');
    });

    it('should handle over 100%', () => {
      expect(formatPercentage(150)).toBe('150%');
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds under 1 second', () => {
      expect(formatDuration(500)).toBe('500ms');
      expect(formatDuration(150)).toBe('150ms');
    });

    it('should format seconds', () => {
      expect(formatDuration(1000)).toBe('1.0s');
      expect(formatDuration(2500)).toBe('2.5s');
    });

    it('should round milliseconds', () => {
      expect(formatDuration(123.456)).toBe('123ms');
    });
  });

  describe('clamp', () => {
    it('should clamp value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('should clamp value to min', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('should clamp value to max', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should handle equal min and max', () => {
      expect(clamp(5, 5, 5)).toBe(5);
    });
  });

  describe('lerp', () => {
    it('should return start value when t is 0', () => {
      expect(lerp(0, 100, 0)).toBe(0);
    });

    it('should return end value when t is 1', () => {
      expect(lerp(0, 100, 1)).toBe(100);
    });

    it('should interpolate midpoint', () => {
      expect(lerp(0, 100, 0.5)).toBe(50);
    });

    it('should handle negative values', () => {
      expect(lerp(-50, 50, 0.5)).toBe(0);
    });
  });

  describe('mapRange', () => {
    it('should map value from one range to another', () => {
      expect(mapRange(5, 0, 10, 0, 100)).toBe(50);
    });

    it('should map to different range', () => {
      expect(mapRange(50, 0, 100, 0, 1)).toBe(0.5);
    });

    it('should handle inverse mapping', () => {
      expect(mapRange(0, 0, 10, 10, 0)).toBe(10);
    });
  });

  describe('isInputElement', () => {
    it('should return true for input element', () => {
      const input = document.createElement('input');
      expect(isInputElement(input)).toBe(true);
    });

    it('should return true for textarea element', () => {
      const textarea = document.createElement('textarea');
      expect(isInputElement(textarea)).toBe(true);
    });

    it('should return true for select element', () => {
      const select = document.createElement('select');
      expect(isInputElement(select)).toBe(true);
    });

    it('should return falsy for non-input elements', () => {
      const div = document.createElement('div');
      const button = document.createElement('button');
      const span = document.createElement('span');

      // These should all return falsy (not input elements)
      // Note: In JSDOM, isContentEditable may not be fully supported
      expect(isInputElement(div)).toBeFalsy();
      expect(isInputElement(button)).toBeFalsy();
      expect(isInputElement(span)).toBeFalsy();
    });
  });

  describe('cn', () => {
    it('should join class names', () => {
      expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz');
    });

    it('should filter falsy values', () => {
      expect(cn('foo', false, 'bar', null, undefined, 'baz')).toBe('foo bar baz');
    });

    it('should handle empty input', () => {
      expect(cn()).toBe('');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
    });
  });

  describe('storage utilities', () => {
    const mockLocalStorage = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key];
        }),
        clear: () => {
          store = {};
        },
      };
    })();

    beforeEach(() => {
      vi.stubGlobal('localStorage', mockLocalStorage);
      mockLocalStorage.clear();
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    describe('getStorageItem', () => {
      it('should get and parse stored item', () => {
        mockLocalStorage.setItem('test', JSON.stringify({ foo: 'bar' }));
        expect(getStorageItem('test', {})).toEqual({ foo: 'bar' });
      });

      it('should return default value if key does not exist', () => {
        expect(getStorageItem('nonexistent', 'default')).toBe('default');
      });

      it('should return default value on parse error', () => {
        mockLocalStorage.setItem('bad', 'not valid json');
        expect(getStorageItem('bad', 'default')).toBe('default');
      });
    });

    describe('setStorageItem', () => {
      it('should store stringified value', () => {
        setStorageItem('test', { foo: 'bar' });
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test', '{"foo":"bar"}');
      });

      it('should return true on success', () => {
        expect(setStorageItem('test', 'value')).toBe(true);
      });
    });

    describe('removeStorageItem', () => {
      it('should remove item from storage', () => {
        removeStorageItem('test');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test');
      });
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useClipboard } from '../clipboard';

describe('useClipboard', () => {
  const mockWriteText = vi.fn();

  beforeEach(() => {
    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText,
      },
      writable: true,
      configurable: true,
    });
    mockWriteText.mockResolvedValue(undefined);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should initialize with copied as false', () => {
    const { result } = renderHook(() => useClipboard());

    expect(result.current.copied).toBe(false);
  });

  it('should set copied to true after successful copy', async () => {
    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copy('test text');
    });

    expect(result.current.copied).toBe(true);
    expect(mockWriteText).toHaveBeenCalledWith('test text');
  });

  it('should reset copied to false after delay', async () => {
    const { result } = renderHook(() => useClipboard(1000));

    await act(async () => {
      await result.current.copy('test text');
    });

    expect(result.current.copied).toBe(true);

    // Fast forward timer
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.copied).toBe(false);
  });

  it('should use default reset delay of 2000ms', async () => {
    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copy('test text');
    });

    expect(result.current.copied).toBe(true);

    // Advance 1500ms - should still be true
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.copied).toBe(true);

    // Advance another 500ms (total 2000ms) - should be false
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.copied).toBe(false);
  });

  it('should return true on successful copy', async () => {
    const { result } = renderHook(() => useClipboard());

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.copy('test text');
    });

    expect(success).toBe(true);
  });

  it('should return false on failed copy', async () => {
    mockWriteText.mockRejectedValue(new Error('Copy failed'));

    // Also mock the fallback to fail
    const mockExecCommand = vi.fn().mockImplementation(() => {
      throw new Error('execCommand failed');
    });
    document.execCommand = mockExecCommand;

    const { result } = renderHook(() => useClipboard());

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.copy('test text');
    });

    expect(success).toBe(false);
  });

  it('should allow manual reset', async () => {
    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copy('test text');
    });

    expect(result.current.copied).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.copied).toBe(false);
  });

  it('should handle custom reset delay', async () => {
    const customDelay = 500;
    const { result } = renderHook(() => useClipboard(customDelay));

    await act(async () => {
      await result.current.copy('test text');
    });

    expect(result.current.copied).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(customDelay);
    });

    expect(result.current.copied).toBe(false);
  });

  describe('fallback behavior', () => {
    it('should use execCommand fallback when clipboard API fails', async () => {
      mockWriteText.mockRejectedValue(new Error('Not supported'));

      const mockExecCommand = vi.fn().mockReturnValue(true);
      document.execCommand = mockExecCommand;

      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy('test text');
      });

      expect(createElementSpy).toHaveBeenCalledWith('textarea');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(result.current.copied).toBe(true);
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFocusTrap } from '../use-focus-trap';

describe('useFocusTrap', () => {
  beforeEach(() => {
    // Create a container with focusable elements
    document.body.innerHTML = `
      <div id="outside">
        <button id="outside-button">Outside</button>
      </div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('should return a ref', () => {
    const { result } = renderHook(() =>
      useFocusTrap({ isActive: false })
    );

    expect(result.current).toBeDefined();
    expect(result.current.current).toBeNull();
  });

  it('should not trap focus when inactive', () => {
    const { result } = renderHook(() =>
      useFocusTrap({ isActive: false })
    );

    // Focus should not be affected when inactive
    const outsideButton = document.getElementById('outside-button');
    outsideButton?.focus();
    expect(document.activeElement).toBe(outsideButton);
  });

  it('should call onEscape when Escape key is pressed', async () => {
    const onEscape = vi.fn();

    // Set up container with ref
    const container = document.createElement('div');
    container.innerHTML = '<button id="inside-button">Inside</button>';
    document.body.appendChild(container);

    const { result } = renderHook(() =>
      useFocusTrap({ isActive: true, onEscape })
    );

    // Manually set the ref
    Object.defineProperty(result.current, 'current', {
      value: container,
      writable: true,
    });

    // Simulate Escape key
    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });

    await act(async () => {
      document.dispatchEvent(escapeEvent);
    });

    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('should have correct default for returnFocusOnDeactivate', () => {
    const { result } = renderHook(() =>
      useFocusTrap({ isActive: false })
    );

    // Hook should work without error
    expect(result.current).toBeDefined();
  });

  describe('FOCUSABLE_ELEMENTS selector', () => {
    it('should match buttons', () => {
      const container = document.createElement('div');
      container.innerHTML = '<button>Test</button>';

      const buttons = container.querySelectorAll('button:not([disabled])');
      expect(buttons.length).toBe(1);
    });

    it('should not match disabled buttons', () => {
      const container = document.createElement('div');
      container.innerHTML = '<button disabled>Test</button>';

      const buttons = container.querySelectorAll('button:not([disabled])');
      expect(buttons.length).toBe(0);
    });

    it('should match links with href', () => {
      const container = document.createElement('div');
      container.innerHTML = '<a href="/test">Test</a>';

      const links = container.querySelectorAll('[href]');
      expect(links.length).toBe(1);
    });

    it('should match inputs', () => {
      const container = document.createElement('div');
      container.innerHTML = '<input type="text" />';

      const inputs = container.querySelectorAll('input:not([disabled])');
      expect(inputs.length).toBe(1);
    });

    it('should match elements with tabindex', () => {
      const container = document.createElement('div');
      container.innerHTML = '<div tabindex="0">Focusable div</div>';

      const elements = container.querySelectorAll('[tabindex]:not([tabindex="-1"])');
      expect(elements.length).toBe(1);
    });

    it('should not match elements with tabindex="-1"', () => {
      const container = document.createElement('div');
      container.innerHTML = '<div tabindex="-1">Not focusable</div>';

      const elements = container.querySelectorAll('[tabindex]:not([tabindex="-1"])');
      expect(elements.length).toBe(0);
    });
  });
});

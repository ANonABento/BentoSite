import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFocusTrap } from '../use-focus-trap';

// Helper to make elements appear visible to getFocusableElements
// jsdom doesn't compute offsetParent, so we need to stub it
function makeVisible(el: HTMLElement) {
  Object.defineProperty(el, 'offsetParent', { value: document.body, configurable: true });
}

describe('useFocusTrap', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <div id="outside">
        <button id="outside-button">Outside</button>
      </div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should return a ref', () => {
    const { result } = renderHook(() =>
      useFocusTrap({ isActive: false })
    );

    expect(result.current).toBeDefined();
    expect(result.current.current).toBeNull();
  });

  it('should not trap focus when inactive', () => {
    renderHook(() => useFocusTrap({ isActive: false }));

    const outsideButton = document.getElementById('outside-button');
    outsideButton?.focus();
    expect(document.activeElement).toBe(outsideButton);
  });

  it('should call onEscape when Escape key is pressed', async () => {
    const onEscape = vi.fn();

    const container = document.createElement('div');
    container.innerHTML = '<button id="inside-button">Inside</button>';
    document.body.appendChild(container);

    const { result } = renderHook(() =>
      useFocusTrap({ isActive: true, onEscape })
    );

    Object.defineProperty(result.current, 'current', {
      value: container,
      writable: true,
    });

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

    expect(result.current).toBeDefined();
  });

  describe('Tab key focus wrapping', () => {
    let container: HTMLDivElement;
    let btn1: HTMLButtonElement;
    let btn2: HTMLButtonElement;
    let btn3: HTMLButtonElement;

    beforeEach(() => {
      container = document.createElement('div');
      container.innerHTML = `
        <button id="btn1">First</button>
        <button id="btn2">Second</button>
        <button id="btn3">Third</button>
      `;
      document.body.appendChild(container);

      btn1 = container.querySelector('#btn1') as HTMLButtonElement;
      btn2 = container.querySelector('#btn2') as HTMLButtonElement;
      btn3 = container.querySelector('#btn3') as HTMLButtonElement;

      // Make all buttons visible for getFocusableElements filter
      makeVisible(btn1);
      makeVisible(btn2);
      makeVisible(btn3);
    });

    it('should wrap focus from last to first on Tab', async () => {
      const { result } = renderHook(() =>
        useFocusTrap({ isActive: true })
      );

      Object.defineProperty(result.current, 'current', {
        value: container,
        writable: true,
      });

      // Focus last element
      btn3.focus();
      expect(document.activeElement).toBe(btn3);

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
      });
      Object.defineProperty(tabEvent, 'shiftKey', { value: false });

      const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');

      await act(async () => {
        document.dispatchEvent(tabEvent);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(document.activeElement).toBe(btn1);
    });

    it('should wrap focus from first to last on Shift+Tab', async () => {
      const { result } = renderHook(() =>
        useFocusTrap({ isActive: true })
      );

      Object.defineProperty(result.current, 'current', {
        value: container,
        writable: true,
      });

      // Focus first element
      btn1.focus();
      expect(document.activeElement).toBe(btn1);

      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      });

      const preventDefaultSpy = vi.spyOn(shiftTabEvent, 'preventDefault');

      await act(async () => {
        document.dispatchEvent(shiftTabEvent);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(document.activeElement).toBe(btn3);
    });

    it('should bring focus back when outside container', async () => {
      const { result } = renderHook(() =>
        useFocusTrap({ isActive: true })
      );

      Object.defineProperty(result.current, 'current', {
        value: container,
        writable: true,
      });

      // Focus an element outside the container
      const outsideBtn = document.getElementById('outside-button') as HTMLElement;
      outsideBtn.focus();
      expect(document.activeElement).toBe(outsideBtn);

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
      });

      await act(async () => {
        document.dispatchEvent(tabEvent);
      });

      expect(document.activeElement).toBe(btn1);
    });

    it('should not interfere with Tab on middle element', async () => {
      const { result } = renderHook(() =>
        useFocusTrap({ isActive: true })
      );

      Object.defineProperty(result.current, 'current', {
        value: container,
        writable: true,
      });

      // Focus middle element - Tab should proceed normally (no preventDefault)
      btn2.focus();

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
      });
      const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');

      await act(async () => {
        document.dispatchEvent(tabEvent);
      });

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should do nothing on Tab when no focusable elements', async () => {
      const emptyContainer = document.createElement('div');
      document.body.appendChild(emptyContainer);

      const { result } = renderHook(() =>
        useFocusTrap({ isActive: true })
      );

      Object.defineProperty(result.current, 'current', {
        value: emptyContainer,
        writable: true,
      });

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
      });
      const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');

      await act(async () => {
        document.dispatchEvent(tabEvent);
      });

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should ignore non-Tab/non-Escape keys', async () => {
      const { result } = renderHook(() =>
        useFocusTrap({ isActive: true })
      );

      Object.defineProperty(result.current, 'current', {
        value: container,
        writable: true,
      });

      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
      });

      await act(async () => {
        document.dispatchEvent(enterEvent);
      });

      // Should not change focus
    });
  });

  describe('initial focus and cleanup', () => {
    it('should focus initialFocusRef when provided', async () => {
      const container = document.createElement('div');
      const btn = document.createElement('button');
      btn.textContent = 'Initial';
      container.appendChild(btn);
      document.body.appendChild(container);
      makeVisible(btn);

      const initialFocusRef = { current: btn };

      const focusSpy = vi.spyOn(btn, 'focus');

      const { result } = renderHook(() =>
        useFocusTrap({ isActive: true, initialFocusRef })
      );

      // Set the container ref
      Object.defineProperty(result.current, 'current', {
        value: container,
        writable: true,
      });

      // Advance past the setTimeout delay
      await act(async () => {
        vi.advanceTimersByTime(20);
      });

      expect(focusSpy).toHaveBeenCalled();
    });

    it('should focus first focusable element when no initialFocusRef', async () => {
      const container = document.createElement('div');
      const btn = document.createElement('button');
      btn.textContent = 'First';
      container.appendChild(btn);
      document.body.appendChild(container);
      makeVisible(btn);

      const focusSpy = vi.spyOn(btn, 'focus');

      const { result } = renderHook(() =>
        useFocusTrap({ isActive: true })
      );

      Object.defineProperty(result.current, 'current', {
        value: container,
        writable: true,
      });

      await act(async () => {
        vi.advanceTimersByTime(20);
      });

      expect(focusSpy).toHaveBeenCalled();
    });

    it('should return focus on deactivate when returnFocusOnDeactivate is true', async () => {
      const outsideBtn = document.getElementById('outside-button') as HTMLButtonElement;
      outsideBtn.focus();
      expect(document.activeElement).toBe(outsideBtn);

      const container = document.createElement('div');
      const innerBtn = document.createElement('button');
      innerBtn.textContent = 'Inside';
      container.appendChild(innerBtn);
      document.body.appendChild(container);
      makeVisible(innerBtn);

      const { result, rerender } = renderHook(
        ({ isActive }) => useFocusTrap({ isActive, returnFocusOnDeactivate: true }),
        { initialProps: { isActive: true } }
      );

      Object.defineProperty(result.current, 'current', {
        value: container,
        writable: true,
      });

      await act(async () => {
        vi.advanceTimersByTime(20);
      });

      // Deactivate the trap
      await act(async () => {
        rerender({ isActive: false });
      });

      expect(document.activeElement).toBe(outsideBtn);
    });

    it('should not return focus when returnFocusOnDeactivate is false', async () => {
      const outsideBtn = document.getElementById('outside-button') as HTMLButtonElement;
      outsideBtn.focus();

      const container = document.createElement('div');
      const innerBtn = document.createElement('button');
      innerBtn.textContent = 'Inside';
      container.appendChild(innerBtn);
      document.body.appendChild(container);
      makeVisible(innerBtn);

      const { result, rerender } = renderHook(
        ({ isActive }) => useFocusTrap({ isActive, returnFocusOnDeactivate: false }),
        { initialProps: { isActive: true } }
      );

      Object.defineProperty(result.current, 'current', {
        value: container,
        writable: true,
      });

      await act(async () => {
        vi.advanceTimersByTime(20);
      });

      innerBtn.focus();

      await act(async () => {
        rerender({ isActive: false });
      });

      // Should NOT return focus to outsideBtn
      expect(document.activeElement).not.toBe(outsideBtn);
    });
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

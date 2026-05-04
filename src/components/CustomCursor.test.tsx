import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomCursor } from './CustomCursor';

let mockPathname = '/';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

type MatchMediaControl = {
  listeners: Set<(event: MediaQueryListEvent) => void>;
  matches: boolean;
};

const mediaControls = new Map<string, MatchMediaControl>();

function installMatchMediaMock() {
  mediaControls.clear();

  window.matchMedia = vi.fn((query: string) => {
    const control: MatchMediaControl = {
      listeners: new Set(),
      matches: false,
    };
    mediaControls.set(query, control);

    return {
      get matches() {
        return control.matches;
      },
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((eventName: string, listener: (event: MediaQueryListEvent) => void) => {
        if (eventName === 'change') {
          control.listeners.add(listener);
        }
      }),
      removeEventListener: vi.fn((eventName: string, listener: (event: MediaQueryListEvent) => void) => {
        if (eventName === 'change') {
          control.listeners.delete(listener);
        }
      }),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;
  });
}

function setMediaQueryMatch(query: string, matches: boolean) {
  const control = mediaControls.get(query);
  if (!control) {
    throw new Error(`Missing media query mock for ${query}`);
  }

  control.matches = matches;
  const event = { matches, media: query } as MediaQueryListEvent;
  control.listeners.forEach((listener) => listener(event));
}

describe('CustomCursor', () => {
  beforeEach(() => {
    mockPathname = '/';
    installMatchMediaMock();
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.classList.remove('custom-cursor-enabled');
    document.querySelectorAll('.custom-cursor-root').forEach((element) => element.remove());
  });

  it('mounts the cursor trail on supported routes and marks interactive hover state', async () => {
    render(
      <>
        <button type="button">Open</button>
        <CustomCursor />
      </>
    );

    await waitFor(() => {
      expect(document.querySelector('.custom-cursor-root')).toBeInTheDocument();
    });

    expect(document.body).toHaveClass('custom-cursor-enabled');
    expect(document.querySelectorAll('.custom-cursor-trail')).toHaveLength(4);

    fireEvent.pointerMove(screen.getByRole('button', { name: 'Open' }), {
      clientX: 40,
      clientY: 48,
    });

    expect(document.querySelector('.custom-cursor-root')).toHaveClass('is-hovering');
  });

  it('does not mount on routes outside the cursor scope', async () => {
    mockPathname = '/photography';

    render(<CustomCursor />);

    await waitFor(() => {
      expect(window.matchMedia).toHaveBeenCalled();
    });

    expect(document.querySelector('.custom-cursor-root')).not.toBeInTheDocument();
    expect(document.body).not.toHaveClass('custom-cursor-enabled');
  });

  it('mounts on the scrollable portfolio route', async () => {
    mockPathname = '/scrollable';

    render(<CustomCursor />);

    await waitFor(() => {
      expect(document.querySelector('.custom-cursor-root')).toBeInTheDocument();
    });
  });

  it('removes the cursor when reduced motion is enabled after mount', async () => {
    render(<CustomCursor />);

    await waitFor(() => {
      expect(document.querySelector('.custom-cursor-root')).toBeInTheDocument();
    });

    act(() => {
      setMediaQueryMatch('(prefers-reduced-motion: reduce)', true);
    });

    await waitFor(() => {
      expect(document.querySelector('.custom-cursor-root')).not.toBeInTheDocument();
    });
    expect(document.body).not.toHaveClass('custom-cursor-enabled');
  });
});

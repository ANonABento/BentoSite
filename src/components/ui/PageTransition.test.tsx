import { render, screen } from '@testing-library/react';
import { useState, type HTMLAttributes, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PageTransition } from './PageTransition';

const mockState = vi.hoisted(() => ({
  pathname: '/',
  reducedMotion: false,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mockState.pathname,
}));

vi.mock('framer-motion', () => {
  type TransitionState = {
    filter?: string;
    opacity?: number;
    y?: number;
  };

  type MotionDivProps = HTMLAttributes<HTMLDivElement> & {
    animate?: string;
    children?: ReactNode;
    exit?: string;
    initial?: string;
    variants?: {
      animate?: TransitionState;
      exit?: TransitionState;
      initial?: TransitionState;
    };
  };

  type AnimatePresenceProps = {
    children?: ReactNode;
    initial?: boolean;
    mode?: string;
  };

  return {
    AnimatePresence: ({ children, initial, mode }: AnimatePresenceProps) => (
      <div
        data-testid="page-transition-presence"
        data-initial={String(initial)}
        data-mode={mode}
      >
        {children}
      </div>
    ),
    LazyMotion: ({ children }: { children?: ReactNode }) => <>{children}</>,
    domAnimation: {},
    m: {
      div: ({
        animate,
        children,
        exit,
        initial,
        variants,
        ...props
      }: MotionDivProps) => (
        <div
          data-testid="page-transition-shell"
          data-animate={animate}
          data-animate-filter={variants?.animate?.filter ?? ''}
          data-animate-opacity={variants?.animate?.opacity ?? ''}
          data-animate-y={variants?.animate?.y ?? ''}
          data-exit={exit}
          data-exit-filter={variants?.exit?.filter ?? ''}
          data-exit-opacity={variants?.exit?.opacity ?? ''}
          data-exit-y={variants?.exit?.y ?? ''}
          data-initial={initial}
          data-initial-filter={variants?.initial?.filter ?? ''}
          data-initial-opacity={variants?.initial?.opacity ?? ''}
          data-initial-y={variants?.initial?.y ?? ''}
          {...props}
        >
          {children}
        </div>
      ),
    },
    useReducedMotion: () => mockState.reducedMotion,
  };
});

describe('PageTransition', () => {
  beforeEach(() => {
    mockState.pathname = '/';
    mockState.reducedMotion = false;
  });

  it('wraps routed content in a wait-mode presence transition', () => {
    render(<PageTransition className="custom-route-shell">Home</PageTransition>);

    const presence = screen.getByTestId('page-transition-presence');
    const shell = screen.getByTestId('page-transition-shell');

    expect(presence).toHaveAttribute('data-mode', 'wait');
    expect(presence).toHaveAttribute('data-initial', 'false');
    expect(shell).toHaveAttribute('data-initial-y', '12');
    expect(shell).toHaveAttribute('data-animate', 'animate');
    expect(shell).toHaveAttribute('data-exit', 'exit');
    expect(shell).toHaveAttribute('data-exit-y', '-8');
    expect(shell).toHaveClass('relative', 'min-h-screen', 'custom-route-shell');
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('remounts the page shell when the pathname changes', () => {
    let mountCount = 0;

    function MountedChild() {
      const [mountId] = useState(() => {
        mountCount += 1;
        return mountCount;
      });

      return <span>mount {mountId}</span>;
    }

    const { rerender } = render(
      <PageTransition>
        <MountedChild />
      </PageTransition>
    );

    expect(screen.getByText('mount 1')).toBeInTheDocument();

    mockState.pathname = '/projects';
    rerender(
      <PageTransition>
        <MountedChild />
      </PageTransition>
    );

    expect(screen.getByText('mount 2')).toBeInTheDocument();
  });

  it('uses the reduced-motion variant when requested', () => {
    mockState.reducedMotion = true;

    render(<PageTransition>Projects</PageTransition>);

    const shell = screen.getByTestId('page-transition-shell');

    expect(shell).toHaveAttribute('data-initial-y', '');
    expect(shell).toHaveAttribute('data-initial-filter', '');
    expect(shell).toHaveAttribute('data-animate-opacity', '1');
    expect(shell).toHaveAttribute('data-exit-y', '');
    expect(shell).toHaveAttribute('data-exit-filter', '');
  });

  it('renders full-screen BentoGrid routes without route animation', () => {
    mockState.pathname = '/projects';

    render(<PageTransition>Projects grid</PageTransition>);

    expect(screen.queryByTestId('page-transition-presence')).not.toBeInTheDocument();
    expect(screen.queryByTestId('page-transition-shell')).not.toBeInTheDocument();
    expect(screen.getByText('Projects grid')).toBeInTheDocument();
  });
});

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
    y?: number;
    filter?: string;
  };

  type MotionDivProps = HTMLAttributes<HTMLDivElement> & {
    animate?: string;
    children?: ReactNode;
    exit?: string;
    initial?: string;
    variants?: {
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
          data-exit={exit}
          data-initial={initial}
          data-initial-filter={variants?.initial?.filter ?? ''}
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
    render(<PageTransition>Home</PageTransition>);

    expect(screen.getByTestId('page-transition-presence')).toHaveAttribute(
      'data-mode',
      'wait'
    );
    expect(screen.getByTestId('page-transition-presence')).toHaveAttribute(
      'data-initial',
      'false'
    );
    expect(screen.getByTestId('page-transition-shell')).toHaveAttribute(
      'data-initial-y',
      '12'
    );
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

    expect(screen.getByTestId('page-transition-shell')).toHaveAttribute(
      'data-initial-y',
      ''
    );
    expect(screen.getByTestId('page-transition-shell')).toHaveAttribute(
      'data-initial-filter',
      ''
    );
  });
});

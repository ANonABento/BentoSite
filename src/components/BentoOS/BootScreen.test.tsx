import { render, screen } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { BootScreen } from './BootScreen';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
      <span {...props}>{children}</span>
    ),
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1 {...props}>{children}</h1>
    ),
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p {...props}>{children}</p>
    ),
  },
}));

vi.mock('./useBootSequence', () => ({
  useBootSequence: () => ({
    completeBoot: vi.fn(),
    filledSegments: 10,
    glitchOffset: 0,
    isBarPhase: true,
    isSkippable: false,
    isVisible: true,
    phase: 'loading',
    showFlash: false,
  }),
}));

describe('BootScreen', () => {
  it('renders the CRT boot metadata and portfolio title', () => {
    render(<BootScreen onExiting={vi.fn()} onComplete={vi.fn()} />);

    // Text is rendered by <Typewriter> (types in over time); aria-label on the
    // wrapper exposes the full string immediately for ATs and tests.
    expect(screen.getByRole('heading', { name: 'bentOS' })).toBeInTheDocument();
    expect(screen.getByLabelText('ANonABento')).toBeInTheDocument();
    expect(screen.getByLabelText('v1.0.0')).toBeInTheDocument();
    expect(screen.getByLabelText('BOOT')).toBeInTheDocument();
    expect(screen.getByLabelText('CRT MODE')).toBeInTheDocument();
    expect(screen.getByLabelText('ANONABENTO PORTFOLIO WEBSITE')).toBeInTheDocument();
    expect(screen.getByLabelText('LOADING SYSTEM MODULES')).toBeInTheDocument();
    expect(screen.getByLabelText('INTERFACE READY')).toBeInTheDocument();
  });
});

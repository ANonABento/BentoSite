import { render, screen } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { BootScreen } from './BootScreen';

vi.mock('framer-motion', () => {
  const motionMock = {
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
  };

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: motionMock,
    m: motionMock,
  };
});

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

    // Text is rendered by <Typewriter> (types in over time); sr-only text
    // exposes the full string immediately for ATs and tests.
    expect(screen.getByRole('heading', { name: 'bentOS' })).toBeInTheDocument();
    expect(screen.getByText('ANonABento', { selector: '.sr-only' })).toBeInTheDocument();
    expect(screen.getByText('v1.0.0', { selector: '.sr-only' })).toBeInTheDocument();
    expect(screen.getByText('BOOT', { selector: '.sr-only' })).toBeInTheDocument();
    expect(screen.getByText('CRT MODE', { selector: '.sr-only' })).toBeInTheDocument();
    expect(screen.getByText('ANONABENTO PORTFOLIO WEBSITE', { selector: '.sr-only' })).toBeInTheDocument();
    expect(screen.getByText('LOADING SYSTEM MODULES', { selector: '.sr-only' })).toBeInTheDocument();
    expect(screen.getByText('INTERFACE READY', { selector: '.sr-only' })).toBeInTheDocument();
  });
});

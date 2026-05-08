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
  },
}));

vi.mock('./useBootSequence', () => ({
  useBootSequence: () => ({
    completeBoot: vi.fn(),
    filledSegments: 16,
    glitchOffset: 0,
    isBarPhase: false,
    isSkippable: true,
    isVisible: true,
    phase: 'ready',
    showFlash: false,
  }),
}));

describe('BootScreen', () => {
  it('renders the CRT boot metadata and portfolio title', () => {
    render(<BootScreen onExiting={vi.fn()} onComplete={vi.fn()} />);

    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'bentOS' })).toBeInTheDocument();
    expect(screen.getByText('ANonABento // Portfolio')).toBeInTheDocument();
    expect(screen.getByText('BOOT')).toBeInTheDocument();
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    expect(screen.getByText('CRT MODE')).toBeInTheDocument();
    // Ready phase swaps the loading bar for the centered terminal prompt card.
    expect(screen.getByText('INTERFACE READY')).toBeInTheDocument();
  });
});

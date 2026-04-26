import { render, screen } from '@testing-library/react';
import type { HTMLAttributes, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScrollReveal } from './ScrollReveal';

const mockState = vi.hoisted(() => ({
  reducedMotion: false,
}));

vi.mock('framer-motion', () => {
  type MotionDivProps = HTMLAttributes<HTMLDivElement> & {
    children?: ReactNode;
    custom?: number;
    initial?: string;
    variants?: {
      hidden?: unknown;
      visible?: unknown;
    };
    viewport?: {
      once?: boolean;
      margin?: string;
    };
    whileInView?: string;
  };

  return {
    m: {
      div: ({
        children,
        custom,
        initial,
        variants,
        viewport,
        whileInView,
        ...props
      }: MotionDivProps) => (
        <div
          data-testid="scroll-reveal"
          data-custom={String(custom)}
          data-has-filter={String(
            typeof variants?.hidden === 'object' &&
              variants.hidden !== null &&
              'filter' in variants.hidden
          )}
          data-initial={initial}
          data-viewport-margin={viewport?.margin ?? ''}
          data-viewport-once={String(viewport?.once)}
          data-while-in-view={whileInView}
          {...props}
        >
          {children}
        </div>
      ),
    },
    useReducedMotion: () => mockState.reducedMotion,
  };
});

describe('ScrollReveal', () => {
  beforeEach(() => {
    mockState.reducedMotion = false;
  });

  it('renders children with the default viewport reveal behavior', () => {
    render(
      <ScrollReveal id="about" className="section-shell" delay={0.12}>
        About section
      </ScrollReveal>
    );

    const reveal = screen.getByTestId('scroll-reveal');

    expect(reveal).toHaveAttribute('id', 'about');
    expect(reveal).toHaveClass('section-shell');
    expect(reveal).toHaveAttribute('data-custom', '0.12');
    expect(reveal).toHaveAttribute('data-initial', 'hidden');
    expect(reveal).toHaveAttribute('data-while-in-view', 'visible');
    expect(reveal).toHaveAttribute('data-viewport-once', 'true');
    expect(reveal).toHaveAttribute('data-viewport-margin', '-80px');
    expect(reveal).toHaveAttribute('data-has-filter', 'true');
    expect(screen.getByText('About section')).toBeInTheDocument();
  });

  it('removes caller delay for reduced-motion reveals', () => {
    mockState.reducedMotion = true;

    render(<ScrollReveal delay={0.2}>Timeline</ScrollReveal>);

    expect(screen.getByTestId('scroll-reveal')).toHaveAttribute('data-custom', '0');
  });
});

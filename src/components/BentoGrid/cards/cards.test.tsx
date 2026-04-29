import { fireEvent, render, screen } from '@testing-library/react';
import type { HTMLAttributes, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CardPosition, GameCardData, ProjectCardData, ThemeConfig } from '../BentoGrid.types';
import { BaseCard } from './BaseCard';
import { GameCard } from './GameCard';
import { ProjectCard } from './ProjectCard';

type MotionDivProps = HTMLAttributes<HTMLDivElement> & {
  animate?: unknown;
  children?: ReactNode;
  exit?: unknown;
  initial?: unknown;
  layoutId?: string;
  onHoverEnd?: () => void;
  onHoverStart?: () => void;
  transition?: unknown;
  whileHover?: unknown;
  whileTap?: unknown;
};

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      animate,
      children,
      exit,
      initial,
      layoutId: _layoutId,
      onHoverEnd,
      onHoverStart,
      transition,
      whileHover,
      whileTap,
      ...props
    }: MotionDivProps) => (
      <div
        data-animate={JSON.stringify(animate ?? null)}
        data-exit={JSON.stringify(exit ?? null)}
        data-initial={JSON.stringify(initial ?? null)}
        data-transition={JSON.stringify(transition ?? null)}
        data-while-hover={JSON.stringify(whileHover ?? null)}
        data-while-tap={JSON.stringify(whileTap ?? null)}
        onMouseEnter={onHoverStart}
        onMouseLeave={onHoverEnd}
        {...props}
      >
        {children}
      </div>
    ),
  },
  useReducedMotion: () => false,
}));

vi.mock('next/image', () => ({
  default: ({
    alt,
    blurDataURL: _blurDataURL,
    fill: _fill,
    placeholder: _placeholder,
    src,
    ...props
  }: {
    alt: string;
    blurDataURL?: string;
    fill?: boolean;
    placeholder?: string;
    src: string;
  } & HTMLAttributes<HTMLImageElement>) => (
    // next/image is not needed for card behavior tests.
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} {...props} />
  ),
}));

const theme: ThemeConfig = {
  name: 'premium',
  background: 'var(--background)',
  card: {
    background: 'var(--glass-bg-strong)',
    border: '1px solid var(--glass-border)',
    borderRadius: 8,
    shadow: '0 4px 24px var(--shadow-color)',
    hoverShadow: '0 8px 40px var(--shadow-color)',
    rotationRange: 0,
  },
  accent: {
    primary: 'var(--purple)',
    secondary: 'var(--orange)',
  },
  searchCard: {
    background: 'var(--overlay-strong)',
    border: '1px solid var(--glass-border)',
  },
};

const position: CardPosition = {
  x: 120,
  y: 80,
  width: 180,
  height: 180,
  rotation: 3,
  size: '1x1',
};

describe('BentoGrid cards', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps hover scaling separate from absolute card positioning', () => {
    render(
      <BaseCard id="test-card" position={position} theme={theme}>
        Card content
      </BaseCard>
    );

    const shell = screen.getByText('Card content').closest('[data-animate]');

    expect(shell).toHaveAttribute('data-animate', expect.stringContaining('"y":80'));
    expect(shell).toHaveAttribute('data-while-hover', '{"scale":1.015,"y":-2}');
  });

  it('renders project metadata and hover links through the shared shell', () => {
    const project: ProjectCardData = {
      id: 'robot-arm',
      type: 'project',
      title: 'Robot Arm',
      description: 'A compact arm controller',
      category: 'Robotics',
      technologies: ['ROS2', 'TypeScript', 'Three.js', 'Python', 'C++'],
      status: 'Completed',
      links: {
        github: 'https://example.com/code',
        demo: 'https://example.com/demo',
      },
    };

    render(<ProjectCard card={project} position={{ ...position, size: '2x2' }} theme={theme} />);

    expect(screen.getByText('READY')).toBeInTheDocument();
    expect(screen.getByText('Robot Arm')).toBeInTheDocument();
    expect(screen.getByText('ROS2')).toBeInTheDocument();

    const shell = screen.getByText('Robot Arm').closest('[data-animate]');
    fireEvent.mouseEnter(shell!);

    expect(screen.getByRole('link', { name: /code/i })).toHaveAttribute('href', project.links?.github);
    expect(screen.getByRole('link', { name: /demo/i })).toHaveAttribute('href', project.links?.demo);
  });

  it('renders game cards when storage is unavailable and the source best score is zero', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    const game: GameCardData = {
      id: 'custom-game',
      type: 'game',
      title: 'Custom Game',
      description: 'Unknown card index should still render',
      category: 'Arcade',
      href: '/playground/custom-game',
      bestScore: 0,
    };

    render(<GameCard card={game} position={position} theme={theme} index={-1} />);

    expect(screen.getByText('Custom Game')).toBeInTheDocument();
    expect(screen.getByText('Best')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});

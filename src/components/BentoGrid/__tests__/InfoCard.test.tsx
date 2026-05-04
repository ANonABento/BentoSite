import { render, screen } from '@testing-library/react';
import type { HTMLAttributes, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SEARCH_CARD, THEME_PREMIUM } from '../BentoGrid.constants';
import { InfoMenuCard, type InfoMenuCardProps } from '../cards/InfoMenuCard';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & {
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
    }) => {
      const domProps = { ...props };
      delete domProps.animate;
      delete domProps.exit;
      delete domProps.initial;
      delete domProps.layoutId;
      delete domProps.onHoverEnd;
      delete domProps.onHoverStart;
      delete domProps.transition;
      delete domProps.whileHover;
      delete domProps.whileTap;

      return <div {...domProps}>{children}</div>;
    },
  },
  useReducedMotion: () => false,
}));

const baseProps: InfoMenuCardProps = {
  theme: THEME_PREMIUM,
  expanded: true,
  edge: 'none',
  position: { x: 400, y: 300 },
  compression: 0,
  width: SEARCH_CARD.EXPANDED_WIDTH,
  height: SEARCH_CARD.EXPANDED_HEIGHT,
  searchTerm: '',
  category: null,
  categories: ['Projects', 'Games'],
  onToggleExpanded: vi.fn(),
  onSearchChange: vi.fn(),
  onCategoryChange: vi.fn(),
  totalCards: 8,
  filteredCards: 8,
};

function renderInfoCard(overrides: Partial<InfoMenuCardProps> = {}) {
  return render(<InfoMenuCard {...baseProps} {...overrides} />);
}

describe('InfoCard', () => {
  it('keeps the regular breadcrumb and filters while fully on-screen', () => {
    renderInfoCard();

    expect(screen.getByText('bentOS')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Info cards' })).toBeInTheDocument();
  });

  it('collapses top and bottom edge states to the compact search bar', () => {
    renderInfoCard({
      edge: 'top',
      compression: 1,
      height: SEARCH_CARD.COLLAPSED_HEIGHT,
    });

    // Breadcrumb stays visible for top/bottom edges (only side squash hides it)
    expect(screen.getByText('bentOS')).toBeInTheDocument();
    // Category filters hidden at full compression (detailsOpacity drops to 0)
    expect(screen.queryByRole('button', { name: 'Projects' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Info cards' })).toBeInTheDocument();
  });

  it('renders icon buttons in the side icon strip', () => {
    renderInfoCard({
      edge: 'left',
      compression: 1,
      width: SEARCH_CARD.SQUASHED_SIDE_WIDTH,
    });

    // Side squash shows icon buttons instead of full UI
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Toggle filters' })).toBeInTheDocument();
    // No text input in icon strip mode
    expect(screen.queryByRole('textbox', { name: 'Info cards' })).not.toBeInTheDocument();
  });
});

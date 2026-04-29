import { render, screen } from '@testing-library/react';
import type { HTMLAttributes, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SEARCH_CARD, THEME_PREMIUM } from '../BentoGrid.constants';
import { SearchCard, type SearchCardProps } from '../search/SearchCard';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & {
      animate?: unknown;
      children?: ReactNode;
      exit?: unknown;
      initial?: unknown;
      transition?: unknown;
      whileHover?: unknown;
    }) => {
      const domProps = { ...props };
      delete domProps.animate;
      delete domProps.exit;
      delete domProps.initial;
      delete domProps.transition;
      delete domProps.whileHover;

      return <div {...domProps}>{children}</div>;
    },
  },
}));

const baseProps: SearchCardProps = {
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

function renderSearchCard(overrides: Partial<SearchCardProps> = {}) {
  return render(<SearchCard {...baseProps} {...overrides} />);
}

describe('SearchCard', () => {
  it('keeps the regular breadcrumb and filters while fully on-screen', () => {
    renderSearchCard();

    expect(screen.getByText('bentOS')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Search cards' })).toBeInTheDocument();
  });

  it('collapses top and bottom edge states to the compact search bar', () => {
    renderSearchCard({
      edge: 'top',
      compression: 1,
      height: SEARCH_CARD.COLLAPSED_HEIGHT,
    });

    expect(screen.queryByText('bentOS')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Projects' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Search cards' })).toBeInTheDocument();
  });

  it('keeps a searchable input in the side icon strip', () => {
    renderSearchCard({
      edge: 'left',
      compression: 1,
      width: SEARCH_CARD.SQUASHED_SIDE_WIDTH,
    });

    expect(screen.queryByText('bentOS')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Search cards' })).toBeInTheDocument();
  });
});

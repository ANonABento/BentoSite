'use client';

/**
 * SearchMenuCard - BentoGrid search card with three display modes:
 *
 * 1. Free (compression=0): Full card with breadcrumb, search, categories, back button
 * 2. Compact bar (top/bottom edge): Horizontal bar with search input + back button
 * 3. Icon strip (left/right edge): Vertical strip with icon buttons
 */

import type { CardPosition, Position, ThemeConfig, SearchCardEdge } from '../BentoGrid.types';
import { SEARCH_CARD_ID } from '../BentoGrid.constants';
import { BaseCard } from './BaseCard';
import {
  CompactBarContent,
  FullSearchContent,
  IconStripContent,
} from './SearchCardContent';

export interface SearchMenuCardProps {
  theme: ThemeConfig;
  expanded: boolean;
  edge: SearchCardEdge;
  position: Position;
  compression: number;
  width: number;
  height: number;
  searchTerm: string;
  category: string | null;
  categories: string[];
  breadcrumb?: string;
  onToggleExpanded: () => void;
  onSearchChange: (term: string) => void;
  onCategoryChange: (category: string | null) => void;
  onBack?: () => void;
  totalCards?: number;
  filteredCards?: number;
}

export function SearchMenuCard({
  theme,
  expanded,
  edge,
  position,
  compression,
  width,
  height,
  searchTerm,
  category,
  categories,
  breadcrumb,
  onToggleExpanded,
  onSearchChange,
  onCategoryChange,
  onBack,
  totalCards,
  filteredCards,
}: SearchMenuCardProps) {
  const isSideEdge = (edge === 'left' || edge === 'right') && compression > 0.8;
  const isHorizontalEdge = (edge === 'top' || edge === 'bottom') && compression > 0.8;

  const cardPosition: CardPosition = {
    x: position.x - width / 2,
    y: position.y - height / 2,
    width,
    height,
    rotation: 0,
    size: '2x1',
  };

  return (
    <BaseCard
      id={SEARCH_CARD_ID}
      position={cardPosition}
      theme={theme}
      positionMode="absolute"
      motionMode="instant"
      className="z-10"
      shellClassName="backdrop-blur-xl"
      shellStyle={{
        background: theme.searchCard.background,
        border: theme.searchCard.border,
        boxShadow: compression > 0
          ? `0 0 0 1px ${theme.accent.primary}33, ${theme.card.hoverShadow}`
          : theme.card.shadow,
      }}
      hoverEnabled={compression === 0}
      onPointerDown={(event) => {
        // Stop pointer events on the search card from reaching the canvas
        // drag gesture handler.
        event.stopPropagation();
      }}
      ariaLabel="Search and filter cards"
    >
      {isSideEdge ? (
        <IconStripContent
          theme={theme}
          searchTerm={searchTerm}
          onToggleExpanded={onToggleExpanded}
          onBack={onBack}
        />
      ) : isHorizontalEdge ? (
        <CompactBarContent
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          onBack={onBack}
          breadcrumb={breadcrumb}
        />
      ) : (
        <FullSearchContent
          theme={theme}
          expanded={expanded}
          searchTerm={searchTerm}
          category={category}
          categories={categories}
          breadcrumb={breadcrumb}
          onToggleExpanded={onToggleExpanded}
          onSearchChange={onSearchChange}
          onCategoryChange={onCategoryChange}
          onBack={onBack}
          totalCards={totalCards}
          filteredCards={filteredCards}
        />
      )}
    </BaseCard>
  );
}

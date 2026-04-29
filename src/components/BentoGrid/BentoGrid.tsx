'use client';

import { useMemo } from 'react';
import { MOBILE, THEMES } from './BentoGrid.constants';
import type { BentoGridProps } from './BentoGrid.types';
import { useWindowSize } from './core';
import { DesktopCanvasView, MobileScrollView } from './views';

export function BentoGrid({
  className,
  theme,
  cards,
  onCardSelect,
  onBack,
  breadcrumb,
  renderCard,
}: BentoGridProps) {
  const windowSize = useWindowSize();
  const isMobile = windowSize.width < MOBILE.BREAKPOINT;
  const themeConfig = THEMES[theme];

  const categories = useMemo(() => {
    const next = new Set<string>();
    cards.forEach((card) => {
      if (card.category) next.add(card.category);
    });
    return Array.from(next).sort();
  }, [cards]);

  if (isMobile) {
    return (
      <MobileScrollView
        className={className}
        cards={cards}
        theme={themeConfig}
        categories={categories}
        breadcrumb={breadcrumb}
        onCardSelect={onCardSelect}
        onBack={onBack}
        renderCard={renderCard}
      />
    );
  }

  return (
    <DesktopCanvasView
      className={className}
      cards={cards}
      theme={themeConfig}
      categories={categories}
      breadcrumb={breadcrumb}
      onCardSelect={onCardSelect}
      onBack={onBack}
      renderCard={renderCard}
    />
  );
}

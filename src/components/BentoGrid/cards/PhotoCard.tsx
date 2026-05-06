'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { PhotoCardData, CardPosition, ThemeConfig } from '../BentoGrid.types';
import { BaseCard } from './BaseCard';

export interface PhotoCardProps {
  card: PhotoCardData;
  position: CardPosition;
  theme: ThemeConfig;
  onClick?: () => void;
  isFocused?: boolean;
  entranceIndex?: number;
}

export function PhotoCard({
  card,
  position,
  theme,
  onClick,
  isFocused = false,
  entranceIndex = 0,
}: PhotoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const isHighlighted = isHovered || isFocused;

  return (
    <BaseCard
      id={card.id}
      position={position}
      theme={theme}
      isFocused={isFocused}
      entranceIndex={entranceIndex}
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      shellClassName="group"
      shellStyle={{
        border: isHighlighted
          ? `1px solid ${theme.accent.primary}40`
          : theme.card.border,
        boxShadow: isFocused
          ? `0 0 0 3px ${theme.accent.primary}, ${theme.card.hoverShadow}`
          : isHighlighted
            ? theme.card.hoverShadow
            : theme.card.shadow,
      }}
      ariaLabel={`${card.title} — ${card.location}, ${card.year}`}
    >
      <div className="relative h-full w-full overflow-hidden">
        <Image
          src={card.src}
          alt={card.alt}
          fill
          sizes={`${position.width}px`}
          className={`object-cover transition duration-500 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } group-hover:scale-105`}
          onLoad={() => setImageLoaded(true)}
          placeholder={card.blurDataURL ? 'blur' : 'empty'}
          blurDataURL={card.blurDataURL}
          draggable={false}
        />

        {/* Overlay with title + metadata */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
          <p className="text-sm font-semibold text-white">{card.title}</p>
          <p className="mt-0.5 text-xs text-white/70">
            {card.location} / {card.year}
          </p>
        </div>
      </div>
    </BaseCard>
  );
}

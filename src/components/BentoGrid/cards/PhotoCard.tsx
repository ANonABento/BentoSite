'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { PhotoCardData, CardPosition, ThemeConfig } from '../BentoGrid.types';
import { MediaCard } from './MediaCard';

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
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <MediaCard
      id={card.id}
      position={position}
      theme={theme}
      isFocused={isFocused}
      entranceIndex={entranceIndex}
      onClick={onClick}
      ariaLabel={`${card.title} — ${card.location}, ${card.year}`}
      title={card.title}
      metaLines={
        <p className="text-xs text-white/70">
          {card.location} / {card.year}
        </p>
      }
    >
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
    </MediaCard>
  );
}

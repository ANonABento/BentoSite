'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import type {
  CardData,
  CardPosition,
  PhotoCardData,
  ThemeConfig,
} from '@/components/BentoGrid';
import { PhotoCard } from '@/components/BentoGrid/cards';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '@/components/ui/Icons';
import type { PhotoItem } from './PhotographyGallery.types';

const BentoGrid = dynamic(
  () => import('@/components/BentoGrid').then((mod) => mod.BentoGrid),
  { ssr: false },
);

function photoToCardData(photo: PhotoItem): PhotoCardData {
  return {
    id: photo.id,
    type: 'photo',
    title: photo.title,
    description: `${photo.location} / ${photo.year}`,
    src: photo.src,
    alt: photo.alt,
    location: photo.location,
    year: photo.year,
    aspectRatio: photo.width / photo.height,
    category: photo.location,
    blurDataURL: photo.blurDataURL,
  };
}

function renderPhotoCard(
  card: CardData,
  position: CardPosition,
  theme: ThemeConfig,
  isFocused?: boolean,
  onClick?: () => void,
  entranceIndex = 0,
): ReactNode {
  if (card.type !== 'photo') return null;

  return (
    <PhotoCard
      card={card}
      position={position}
      theme={theme}
      isFocused={isFocused}
      onClick={onClick}
      entranceIndex={entranceIndex}
    />
  );
}

interface PhotographyGridClientProps {
  photos: readonly PhotoItem[];
}

export function PhotographyGridClient({ photos }: PhotographyGridClientProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activePhoto = activeIndex === null ? null : photos[activeIndex];

  const photoCards = useMemo(
    () => photos.map(photoToCardData),
    [photos],
  );

  const handleCardSelect = useCallback(
    (card: CardData) => {
      const index = photos.findIndex((p) => p.id === card.id);
      if (index >= 0) setActiveIndex(index);
    },
    [photos],
  );

  const handleBack = useCallback(() => {
    router.push('/');
  }, [router]);

  const closeLightbox = useCallback(() => setActiveIndex(null), []);
  const showPrevious = useCallback(() => {
    setActiveIndex((i) =>
      i === null ? i : (i - 1 + photos.length) % photos.length,
    );
  }, [photos.length]);
  const showNext = useCallback(() => {
    setActiveIndex((i) =>
      i === null ? i : (i + 1) % photos.length,
    );
  }, [photos.length]);

  useEffect(() => {
    if (activeIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeLightbox(); return; }
      if (event.key === 'ArrowLeft') { event.preventDefault(); showPrevious(); }
      if (event.key === 'ArrowRight') { event.preventDefault(); showNext(); }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeIndex, closeLightbox, showNext, showPrevious]);

  return (
    <>
      <BentoGrid
        theme="premium"
        cards={photoCards}
        onCardSelect={handleCardSelect}
        onBack={handleBack}
        breadcrumb="bentOS / photography"
        renderCard={renderPhotoCard}
      />

      {activePhoto && activeIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/90 text-white backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-label={`${activePhoto.title} lightbox`}
        >
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{activePhoto.title}</p>
              <p className="truncate text-xs text-white/60">
                {activePhoto.location} / {activePhoto.year} / {activeIndex + 1} of {photos.length}
              </p>
            </div>
            <button
              type="button"
              onClick={closeLightbox}
              className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition-colors"
              aria-label="Close lightbox"
            >
              <CloseIcon size={20} />
            </button>
          </div>

          <div className="relative min-h-0 flex-1">
            <Image
              src={activePhoto.src}
              alt={activePhoto.alt}
              fill
              sizes="100vw"
              className="object-contain p-4 sm:p-8"
              priority
              placeholder={activePhoto.blurDataURL ? 'blur' : 'empty'}
              blurDataURL={activePhoto.blurDataURL}
            />

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPrevious}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition-colors sm:left-6"
                  aria-label="Previous photo"
                >
                  <ChevronLeftIcon size={24} />
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition-colors sm:right-6"
                  aria-label="Next photo"
                >
                  <ChevronRightIcon size={24} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

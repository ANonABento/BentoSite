'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftIcon,
  CameraIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
} from '@/components/ui/Icons';
import type { PhotoItem } from './PhotographyGallery.types';

type PhotographyGalleryProps = {
  photos: readonly PhotoItem[];
};

export function PhotographyGallery({ photos }: PhotographyGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activePhoto = activeIndex === null ? null : photos[activeIndex];

  const photoCountLabel = useMemo(
    () => `${photos.length} ${photos.length === 1 ? 'frame' : 'frames'}`,
    [photos.length]
  );

  const closeLightbox = useCallback(() => setActiveIndex(null), []);
  const showPrevious = useCallback(() => {
    setActiveIndex((index) =>
      index === null ? index : (index - 1 + photos.length) % photos.length
    );
  }, [photos.length]);
  const showNext = useCallback(() => {
    setActiveIndex((index) => (index === null ? index : (index + 1) % photos.length));
  }, [photos.length]);

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeLightbox();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showPrevious();
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        showNext();
      }
    };

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeIndex, closeLightbox, showNext, showPrevious]);

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[var(--background)] bg-grid text-[var(--text-primary)] transition-colors duration-300"
    >
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="flex flex-col gap-6 border-b border-[var(--border)] pb-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <Link
              href="/"
              className="interactive-hover mb-6 inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--primary-muted)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)] focus-ring"
            >
              <ArrowLeftIcon size={16} />
              bentOS
            </Link>
            <div className="mb-4 flex items-center gap-3 text-[var(--primary)]">
              <CameraIcon size={22} />
              <p className="font-mono text-sm uppercase tracking-[0.2em]">
                photography
              </p>
            </div>
            <h1 className="text-4xl font-semibold tracking-normal text-[var(--text-primary)] sm:text-5xl">
              Field notes in light, material, and motion.
            </h1>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[var(--text-secondary)] md:text-right">
            {photoCountLabel} from the same visual system as the engineering portfolio:
            optimized, responsive, and built for quick inspection.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className="group relative aspect-[4/5] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--glass-bg)] text-left shadow-soft focus-ring sm:aspect-[3/4] lg:even:aspect-[4/3]"
              aria-label={`Open ${photo.title}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition duration-500 group-hover:scale-105"
                placeholder={photo.blurDataURL ? 'blur' : 'empty'}
                blurDataURL={photo.blurDataURL}
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--overlay-strong)] via-[var(--overlay)] to-transparent p-4 text-[var(--text-on-overlay)] opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                <span className="block text-base font-semibold">{photo.title}</span>
                <span className="mt-1 block text-sm text-[var(--text-on-overlay)]">
                  {photo.location} / {photo.year}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {activePhoto && activeIndex !== null ? (
        <Lightbox
          photo={activePhoto}
          position={activeIndex + 1}
          total={photos.length}
          onClose={closeLightbox}
          onPrevious={showPrevious}
          onNext={showNext}
        />
      ) : null}
    </main>
  );
}

function Lightbox({
  photo,
  position,
  total,
  onClose,
  onPrevious,
  onNext,
}: {
  photo: PhotoItem;
  position: number;
  total: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[var(--overlay-strong)] text-[var(--text-on-overlay)] backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label={`${photo.title} lightbox`}
    >
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{photo.title}</p>
          <p className="truncate text-xs text-[var(--text-secondary)]">
            {photo.location} / {photo.year} / {position} of {total}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="interactive-hover rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] p-2 text-[var(--text-on-overlay)] hover:bg-[var(--overlay)] focus-ring"
          aria-label="Close lightbox"
        >
          <CloseIcon size={20} />
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="100vw"
          className="object-contain p-4 sm:p-8"
          priority
          placeholder={photo.blurDataURL ? 'blur' : 'empty'}
          blurDataURL={photo.blurDataURL}
        />

        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={onPrevious}
              className="interactive-hover absolute left-3 top-1/2 -translate-y-1/2 rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] p-3 text-[var(--text-on-overlay)] hover:bg-[var(--overlay)] focus-ring sm:left-6"
              aria-label="Previous photo"
            >
              <ChevronLeftIcon size={24} />
            </button>
            <button
              type="button"
              onClick={onNext}
              className="interactive-hover absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-[var(--border)] bg-[var(--overlay-weak)] p-3 text-[var(--text-on-overlay)] hover:bg-[var(--overlay)] focus-ring sm:right-6"
              aria-label="Next photo"
            >
              <ChevronRightIcon size={24} />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

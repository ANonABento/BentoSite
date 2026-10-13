'use client';

import Image from 'next/image';
import type { ViewfinderItem } from '../types';

interface ImageGalleryProps {
  images: ViewfinderItem[];
  index: number;
  onIndex: (index: number) => void;
  alt: string;
}

/** One image at a time, uncropped, with arrows and a thumbnail strip. ←/→ are handled by the viewfinder. */
export function ImageGallery({ images, index, onIndex, alt }: ImageGalleryProps) {
  const current = images[index] ?? images[0];
  const many = images.length > 1;
  const step = (delta: number) => onIndex((index + delta + images.length) % images.length);

  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-0 flex-1">
        <Image
          key={current.src}
          src={current.src}
          alt={current.label ?? alt}
          fill
          sizes="(min-width: 1024px) 800px, 100vw"
          className="object-contain"
          priority
        />
        {many && (
          <>
            <Arrow side="left" onClick={() => step(-1)} />
            <Arrow side="right" onClick={() => step(1)} />
            <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-0.5 font-crt text-lg leading-none text-rice">
              {index + 1}/{images.length}
            </span>
          </>
        )}
      </div>
      {many && (
        <div className="flex shrink-0 gap-1.5 overflow-x-auto p-2" data-wheel-scroll>
          {images.map((image, i) => (
            <button
              key={image.src}
              onClick={() => onIndex(i)}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-cell-raised ${
                i === index ? 'ring-2 ring-orange' : 'opacity-60 hover:opacity-100'
              }`}
              aria-label={`Image ${i + 1}`}
            >
              <Image src={image.src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Arrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-xl text-rice backdrop-blur-sm transition-colors hover:bg-orange hover:text-lacquer ${
        side === 'left' ? 'left-3' : 'right-3'
      }`}
      aria-label={side === 'left' ? 'Previous image' : 'Next image'}
    >
      {side === 'left' ? '‹' : '›'}
    </button>
  );
}

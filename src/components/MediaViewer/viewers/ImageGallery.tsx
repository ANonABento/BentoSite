'use client';

import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';

import type { ImageGalleryProps } from '../MediaViewer.types';

export function ImageGallery({ images, initialIndex = 0, onClose }: ImageGalleryProps) {
  const slides = images.map((src) => ({ src }));

  return (
    <Lightbox
      open={true}
      close={onClose}
      index={initialIndex}
      slides={slides}
      plugins={[Zoom, Counter, Thumbnails]}
      animation={{ fade: 300 }}
      carousel={{ finite: images.length <= 1 }}
      controller={{ closeOnBackdropClick: true }}
      zoom={{
        maxZoomPixelRatio: 3,
        scrollToZoom: true,
      }}
      thumbnails={{
        position: 'bottom',
        width: 80,
        height: 60,
        gap: 8,
      }}
      styles={{
        container: { backgroundColor: 'rgba(0, 0, 0, 0.95)' },
      }}
    />
  );
}

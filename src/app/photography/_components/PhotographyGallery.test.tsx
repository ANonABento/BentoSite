import { fireEvent, render, screen } from '@testing-library/react';
import type { HTMLAttributes } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PhotographyGallery } from './PhotographyGallery';
import type { PhotoItem } from './PhotographyGallery.types';

vi.mock('next/image', () => ({
  default: ({
    alt,
    src,
    priority,
    fill,
    sizes,
    placeholder,
    blurDataURL,
    ...props
  }: HTMLAttributes<HTMLSpanElement> & {
    alt: string;
    src: string;
    priority?: boolean;
    fill?: boolean;
    sizes?: string;
    placeholder?: string;
    blurDataURL?: string;
  }) => {
    void priority;
    void fill;
    void sizes;
    void placeholder;
    void blurDataURL;

    return <span role="img" aria-label={alt} data-src={src} {...props} />;
  },
}));

const photos: PhotoItem[] = [
  {
    id: 'lab-after-hours',
    src: '/photos/lab-after-hours.jpg',
    alt: 'Warm workbench scene',
    title: 'Lab After Hours',
    location: 'Waterloo',
    year: '2026',
    width: 1600,
    height: 2000,
  },
  {
    id: 'signal-path',
    src: '/photos/signal-path.jpg',
    alt: 'Diagonal light across a technical surface',
    title: 'Signal Path',
    location: 'Toronto',
    year: '2026',
    width: 1800,
    height: 1350,
  },
  {
    id: 'calibration',
    src: '/photos/calibration.jpg',
    alt: 'Grid composition with purple and orange highlights',
    title: 'Calibration',
    location: 'Montreal',
    year: '2025',
    width: 1600,
    height: 2000,
  },
];

describe('PhotographyGallery', () => {
  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('renders a responsive photo grid from the manifest data', () => {
    render(<PhotographyGallery photos={photos} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Field notes in light, material, and motion.'
    );
    expect(screen.getByText('3 frames', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /bentos/i })).toHaveAttribute('href', '/');
    expect(screen.getAllByRole('button', { name: /^Open / })).toHaveLength(photos.length);

    for (const photo of photos) {
      expect(screen.getByRole('button', { name: `Open ${photo.title}` })).toBeInTheDocument();
      expect(screen.getByText(photo.title)).toBeInTheDocument();
      expect(screen.getByLabelText(photo.alt)).toHaveAttribute('data-src', photo.src);
    }
  });

  it('opens a lightbox and supports click and keyboard navigation', () => {
    render(<PhotographyGallery photos={photos} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Lab After Hours' }));

    expect(screen.getByRole('dialog', { name: 'Lab After Hours lightbox' })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');
    expect(screen.getByText('Waterloo / 2026 / 1 of 3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
    expect(screen.getByRole('dialog', { name: 'Signal Path lightbox' })).toBeInTheDocument();
    expect(screen.getByText('Toronto / 2026 / 2 of 3')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByRole('dialog', { name: 'Lab After Hours lightbox' })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('restores the previous body overflow when the lightbox closes', () => {
    document.body.style.overflow = 'clip';

    render(<PhotographyGallery photos={photos} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open Calibration' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close lightbox' }));

    expect(document.body.style.overflow).toBe('clip');
  });
});

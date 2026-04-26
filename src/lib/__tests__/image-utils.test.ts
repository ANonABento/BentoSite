import { describe, expect, it } from 'vitest';
import {
  BLUR_PLACEHOLDERS,
  createColorPlaceholder,
  createShimmerPlaceholder,
  getBlurPlaceholder,
} from '../image-utils';

function decodeSvgDataUrl(dataUrl: string): string {
  expect(dataUrl).toMatch(/^data:image\/svg\+xml,/);
  return decodeURIComponent(dataUrl.replace(/^data:image\/svg\+xml,/, ''));
}

describe('image utils', () => {
  it('creates browser-safe encoded shimmer SVG placeholders', () => {
    const placeholder = createShimmerPlaceholder(640, 360);
    const svg = decodeSvgDataUrl(placeholder);

    expect(placeholder).not.toContain(';base64,');
    expect(svg).toContain('width="640"');
    expect(svg).toContain('height="360"');
    expect(svg).toContain('<linearGradient');
  });

  it('creates encoded color placeholders with escaped color values', () => {
    const placeholder = createColorPlaceholder('#0a0a0f');
    const svg = decodeSvgDataUrl(placeholder);

    expect(placeholder).toContain('%23');
    expect(svg).toContain('fill="#0a0a0f"');
  });

  it('selects the closest predefined placeholder by aspect ratio', () => {
    expect(getBlurPlaceholder(400, 300)).toBe(BLUR_PLACEHOLDERS['4:3']);
    expect(getBlurPlaceholder(1920, 1080)).toBe(BLUR_PLACEHOLDERS['16:9']);
    expect(getBlurPlaceholder(512, 512)).toBe(BLUR_PLACEHOLDERS['1:1']);
    expect(getBlurPlaceholder(600, 400)).toBe(BLUR_PLACEHOLDERS['3:2']);
  });

  it('falls back to the default placeholder for missing or uncommon dimensions', () => {
    expect(getBlurPlaceholder()).toBe(BLUR_PLACEHOLDERS.default);
    expect(getBlurPlaceholder(0, 300)).toBe(BLUR_PLACEHOLDERS.default);
    expect(getBlurPlaceholder(-400, 300)).toBe(BLUR_PLACEHOLDERS.default);
    expect(getBlurPlaceholder(Number.POSITIVE_INFINITY, 300)).toBe(BLUR_PLACEHOLDERS.default);
    expect(getBlurPlaceholder(100, 1000)).toBe(BLUR_PLACEHOLDERS.default);
  });
});

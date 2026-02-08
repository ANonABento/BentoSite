/**
 * Image utilities for blur placeholders and optimization
 * 
 * Provides utilities for:
 * - Generating blur data URLs for Next.js Image component
 * - Creating shimmer effects for loading states
 * - Base64-encoded SVG placeholders
 */

/**
 * Creates a shimmer SVG placeholder as a base64 data URL
 * This provides a nice gradient loading effect before images load
 */
export function createShimmerPlaceholder(width: number, height: number): string {
  const shimmerSvg = `
    <svg width="${width}" height="${height}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop stop-color="#1a1a2e" offset="0%" />
          <stop stop-color="#16213e" offset="50%" />
          <stop stop-color="#1a1a2e" offset="100%" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#g)" />
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(shimmerSvg).toString('base64')}`;
}

/**
 * Creates a solid color placeholder based on theme colors
 */
export function createColorPlaceholder(color: string = '#1a1a2e'): string {
  const svg = `
    <svg width="1" height="1" xmlns="http://www.w3.org/2000/svg">
      <rect width="1" height="1" fill="${color}" />
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Predefined blur placeholders for common aspect ratios
 * These are tiny base64-encoded images that show while the real image loads
 */
export const BLUR_PLACEHOLDERS = {
  // 4:3 aspect ratio (project thumbnails)
  '4:3': createShimmerPlaceholder(400, 300),
  
  // 16:9 aspect ratio (widescreen images)
  '16:9': createShimmerPlaceholder(640, 360),
  
  // 1:1 aspect ratio (square images)
  '1:1': createShimmerPlaceholder(400, 400),
  
  // 3:2 aspect ratio (photos)
  '3:2': createShimmerPlaceholder(600, 400),
  
  // Default dark theme placeholder
  default: createColorPlaceholder('#0a0a0f'),
  
  // Glass effect placeholder
  glass: createColorPlaceholder('rgba(255, 255, 255, 0.05)'),
} as const;

/**
 * Get appropriate blur placeholder based on dimensions
 */
export function getBlurPlaceholder(width?: number, height?: number): string {
  if (!width || !height) {
    return BLUR_PLACEHOLDERS.default;
  }
  
  const ratio = width / height;
  
  // Determine closest aspect ratio
  if (Math.abs(ratio - 4/3) < 0.1) return BLUR_PLACEHOLDERS['4:3'];
  if (Math.abs(ratio - 16/9) < 0.1) return BLUR_PLACEHOLDERS['16:9'];
  if (Math.abs(ratio - 1) < 0.1) return BLUR_PLACEHOLDERS['1:1'];
  if (Math.abs(ratio - 3/2) < 0.1) return BLUR_PLACEHOLDERS['3:2'];
  
  return BLUR_PLACEHOLDERS.default;
}

/**
 * CSS class for shimmer animation effect
 * Use this with a div for loading states
 */
export const shimmerClassName = 'skeleton-shimmer';

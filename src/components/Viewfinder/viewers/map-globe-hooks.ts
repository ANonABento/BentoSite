import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { loadLandMaskTexture } from './map-texture';

export interface GlobePalette {
  surface: string;
  land: string;
  interactive: string;
  highlight: string;
}

const DEFAULT_GLOBE_PALETTE: GlobePalette = {
  surface: '#23252d',
  land: '#9ca3af',
  interactive: '#e07b3c',
  highlight: '#e07b3c',
};

function readCssVar(variableName: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  return value || fallback;
}

export function useGlobePalette(): GlobePalette {
  const [palette, setPalette] = useState<GlobePalette>(DEFAULT_GLOBE_PALETTE);

  useEffect(() => {
    const updatePalette = () => {
      setPalette({
        surface: readCssVar('--surface-deep', DEFAULT_GLOBE_PALETTE.surface),
        land: readCssVar('--text-secondary', DEFAULT_GLOBE_PALETTE.land),
        interactive: readCssVar('--primary', DEFAULT_GLOBE_PALETTE.interactive),
        highlight: readCssVar('--orange', DEFAULT_GLOBE_PALETTE.highlight),
      });
    };

    updatePalette();

    const observer = new MutationObserver(updatePalette);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    return () => observer.disconnect();
  }, []);

  return palette;
}

export function useLandMaskTexture() {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    loadLandMaskTexture(controller.signal)
      .then((landMask) => {
        if (mounted && landMask) {
          setTexture(landMask);
        }
      })
      .catch(() => {
        // Keep plain sphere if texture loading fails.
      });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  return texture;
}

export interface MapRenderConfig {
  supportsHover: boolean;
  dotStep: number;
  dotSize: number;
}

const DEFAULT_CONFIG: MapRenderConfig = {
  supportsHover: true,
  dotStep: 6,
  dotSize: 0.011,
};

export function useMapRenderConfig(): MapRenderConfig {
  const [config, setConfig] = useState<MapRenderConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    const update = () => {
      const isSmall = window.innerWidth < 768;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      const hasLowMemory =
        typeof navigator !== 'undefined' &&
        'deviceMemory' in navigator &&
        (navigator as Navigator & { deviceMemory?: number }).deviceMemory !== undefined &&
        ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4;

      if (reducedMotion || hasLowMemory) {
        setConfig({ supportsHover, dotStep: 10, dotSize: 0.009 });
        return;
      }

      if (isSmall) {
        setConfig({ supportsHover, dotStep: 8, dotSize: 0.01 });
        return;
      }

      setConfig({ supportsHover, dotStep: 6, dotSize: 0.011 });
    };

    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, []);

  return config;
}

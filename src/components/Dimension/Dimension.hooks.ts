// Dimension.tsx - Custom Hooks

import { useCallback, useEffect, useRef, useState } from 'react';
import { isMobileDevice } from './Dimension.utils';
import { useToast } from '@/components/ui/Toast';

// Keyboard shortcuts callbacks interface
interface KeyboardCallbacks {
  onResetView?: () => void;
  onToggleAutoRotate?: () => void;
  onToggleWireframe?: () => void;
  onScreenshot?: () => void;
  onToggleFullscreen?: () => void;
  onZoomFit?: () => void;
  onCameraPresets?: () => void;
  onModelManager?: () => void;
}

/**
 * Hook to detect if device is mobile
 * Uses centralized isMobileDevice utility function
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(isMobileDevice());

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

/**
 * Hook for keyboard shortcuts
 * Uses individual callback refs to avoid re-registering listeners
 */
export const useKeyboardShortcuts = (callbacks: KeyboardCallbacks) => {
  // Store callbacks in refs to avoid effect re-runs
  const callbacksRef = useRef(callbacks);

  // Update ref in effect to avoid setting during render
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const { key } = event;
      const cbs = callbacksRef.current;

      switch (key.toLowerCase()) {
        case 'r':
          cbs.onResetView?.();
          break;
        case ' ':
          event.preventDefault(); // Prevent page scroll
          cbs.onToggleAutoRotate?.();
          break;
        case 'w':
          cbs.onToggleWireframe?.();
          break;
        case 's':
          cbs.onScreenshot?.();
          break;
        case 'f':
          cbs.onToggleFullscreen?.();
          break;
        case 'c':
          cbs.onCameraPresets?.();
          break;
        case 'm':
          cbs.onModelManager?.();
          break;
        case 'z':
          cbs.onZoomFit?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []); // Empty deps - callbacks accessed via ref
};

// Note: Touch gestures (pinch zoom) are handled natively by OrbitControls
// Note: Keyboard help ('?') and Performance HUD ('P') were removed as unused

/**
 * Owns the fullscreen state for a single container element. Returns a
 * ref to attach to the container, the current state, and a toggle
 * handler. The state is kept in sync with the browser's
 * `fullscreenchange` event so dropping out via Escape updates the UI.
 */
export const useFullscreen = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    if (!document.fullscreenElement) {
      container.requestFullscreen?.();
      return;
    }

    document.exitFullscreen?.();
  }, []);

  return { containerRef, isFullscreen, toggleFullscreen };
};

/**
 * Captures the WebGL canvas as a PNG and triggers a download. Returns
 * a ref to attach to the `<canvas>` plus the capture handler. The
 * filename uses the provided `getModelName` callback so the latest
 * selected model is reflected without re-binding the handler.
 */
export const useScreenshot = (getModelName: () => string) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { success: toastSuccess, error: toastError } = useToast();
  const getModelNameRef = useRef(getModelName);

  useEffect(() => {
    getModelNameRef.current = getModelName;
  });

  const capture = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toastError('Screenshot failed: Canvas not available');
      return;
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        toastError('Screenshot failed: Could not capture image');
        return;
      }

      let url: string | null = null;
      try {
        url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const safeName = getModelNameRef.current().replace(/[^a-z0-9]/gi, '_');
        link.download = `${safeName}_screenshot.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toastSuccess('Screenshot saved!');
      } catch (downloadError) {
        toastError('Screenshot failed: Download error');
        if (process.env.NODE_ENV === 'development') {
          console.error('Screenshot failed:', downloadError);
        }
      } finally {
        if (url) {
          URL.revokeObjectURL(url);
        }
      }
    }, 'image/png');
  }, [toastError, toastSuccess]);

  return { canvasRef, capture };
};

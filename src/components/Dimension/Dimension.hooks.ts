// Dimension.tsx - Custom Hooks

import { useRef, useState, useEffect, useMemo } from 'react';
import type { ModelInfo } from './Dimension.types';

// Keyboard shortcuts callbacks interface
interface KeyboardCallbacks {
  onResetView?: () => void;
  onToggleAutoRotate?: () => void;
  onToggleWireframe?: () => void;
  onScreenshot?: () => void;
  onToggleFullscreen?: () => void;
  onZoomFit?: () => void;
  onCameraPresets?: () => void;
  on360Export?: () => void;
}

/**
 * Hook to detect if device is mobile
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
   
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                           window.innerWidth < 768 ||
                           ('ontouchstart' in window);
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
   
  return isMobile;
};

/**
 * Hook to track screen size
 */
export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });
  
  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return screenSize;
};

/**
 * Hook to monitor performance (FPS)
 */
export const usePerformanceMonitor = () => {
  const [fps, setFps] = useState(60);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(0);

  // Initialize lastTimeRef in first updateFps call instead of during render
  const updateFps = () => {
    const currentTime = performance.now();
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = currentTime;
    }
    frameCountRef.current++;

    if (currentTime >= lastTimeRef.current + 1000) {
      setFps(Math.round((frameCountRef.current * 1000) / (currentTime - lastTimeRef.current)));
      frameCountRef.current = 0;
      lastTimeRef.current = currentTime;
    }
  };

  return { fps, updateFps };
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
        case 'e':
          cbs.on360Export?.();
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

/**
 * Hook for touch gestures (pinch zoom)
 * Returns a ref to attach to the container element
 */
export const useTouchGestures = (onPinchZoom?: (delta: number) => void) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastDistanceRef = useRef<number | null>(null);
  const onPinchZoomRef = useRef(onPinchZoom);

  // Update ref in effect to avoid setting during render
  useEffect(() => {
    onPinchZoomRef.current = onPinchZoom;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (event: TouchEvent) => {
      // Only handle multi-touch for pinch zoom
      if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        lastDistanceRef.current = distance;
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      // Handle pinch zoom with minimum threshold to reduce jitter
      if (event.touches.length === 2 && lastDistanceRef.current && onPinchZoomRef.current) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const currentDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        const delta = currentDistance - lastDistanceRef.current;

        // Only trigger zoom if delta exceeds minimum threshold (reduces jitter)
        if (Math.abs(delta) > 2) {
          onPinchZoomRef.current(delta * 0.01);
          lastDistanceRef.current = currentDistance;
        }
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      // Reset pinch zoom tracking
      if (event.touches.length < 2) {
        lastDistanceRef.current = null;
      }
    };

    // Add touch event listeners to the container only
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, []); // Empty deps - callback accessed via ref

  return containerRef;
};

/**
 * Hook for keyboard shortcut help display
 */
export const useKeyboardHelp = () => {
  const [showHelp, setShowHelp] = useState(false);
  
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === '?' || event.key === '/') {
        setShowHelp(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  return showHelp;
};

/**
 * Hook for performance HUD display
 */
export const usePerformanceHUD = () => {
  const [showHUD, setShowHUD] = useState(false);
  
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'p' || event.key === 'P') {
        setShowHUD(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  return { showHUD, setShowHUD };
};

/**
 * Hook for model search and filtering
 */
export const useModelSearch = (models: ModelInfo[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Memoize categories to avoid recalculating on every render
  const categories = useMemo(() => {
    const uniqueCategories = new Set(models.map((model) => model.category));
    return ['All', ...Array.from(uniqueCategories)];
  }, [models]);

  // Memoize filtered models
  const filteredModels = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return models.filter((model) => {
      const matchesSearch = model.name.toLowerCase().includes(searchLower) ||
                           model.description.toLowerCase().includes(searchLower);
      const matchesCategory = selectedCategory === 'All' || model.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [models, searchTerm, selectedCategory]);

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredModels,
  };
};
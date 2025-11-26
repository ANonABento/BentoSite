// Dimension.tsx - Custom Hooks

import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

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
  const lastTimeRef = useRef(performance.now());
  
  const updateFps = () => {
    frameCountRef.current++;
    const currentTime = performance.now();
    
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
 */
export const useKeyboardShortcuts = (callbacks: KeyboardCallbacks) => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const { key } = event;
      
      switch (key.toLowerCase()) {
        case 'r':
          callbacks.onResetView?.();
          break;
        case ' ':
          event.preventDefault(); // Prevent page scroll
          callbacks.onToggleAutoRotate?.();
          break;
        case 'w':
          callbacks.onToggleWireframe?.();
          break;
        case 's':
          callbacks.onScreenshot?.();
          break;
        case 'f':
          callbacks.onToggleFullscreen?.();
          break;
        case 'c':
          callbacks.onCameraPresets?.();
          break;
        case 'e':
          callbacks.on360Export?.();
          break;
        case 'z':
          callbacks.onZoomFit?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [callbacks]);
};

/**
 * Hook for touch gestures (pinch zoom)
 */
export const useTouchGestures = (onPinchZoom?: (delta: number) => void) => {
  const touchStartRef = useRef<{ [key: number]: { x: number; y: number } }>({});
  const lastDistanceRef = useRef<number | null>(null);

  useEffect(() => {
    const handleTouchStart = (event: TouchEvent) => {
      event.preventDefault();
      
      // Store initial touch positions
      Array.from(event.touches).forEach((touch) => {
        touchStartRef.current[touch.identifier] = { x: touch.clientX, y: touch.clientY };
      });
      
      // Calculate initial distance for pinch zoom
      if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        lastDistanceRef.current = distance;
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault();
      
      // Handle pinch zoom
      if (event.touches.length === 2 && lastDistanceRef.current && onPinchZoom) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const currentDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        const delta = currentDistance - lastDistanceRef.current;
        onPinchZoom(delta * 0.01); // Scale the zoom factor
        lastDistanceRef.current = currentDistance;
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      event.preventDefault();
      
      // Reset pinch zoom tracking
      if (event.touches.length < 2) {
        lastDistanceRef.current = null;
      }
    };

    // Add touch event listeners with passive: false to allow preventDefault
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onPinchZoom]);
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
export const useModelSearch = (models: any[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Get unique categories
  const categories = ['All', ...Array.from(new Set(models.map((model: any) => model.category)))];
  
  // Filter models based on search and category
  const filteredModels = models.filter((model: any) => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || model.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredModels,
  };
};
// Re-export all UI components for backward compatibility
export * from './widgets';
export * from './modals';
export * from './feedback';
export * from './shared';

// PerformanceHUD component (simplified)
export function PerformanceHUD({ isMobile }: { isMobile: boolean }) {
  return null;
}
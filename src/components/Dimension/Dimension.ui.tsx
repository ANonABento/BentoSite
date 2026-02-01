// Dimension.tsx - Enhanced UI Components with Improved Accessibility and Visual Design
// REFACTORED: Now uses modular component structure for better maintainability

import type { PerformanceHUDProps } from './Dimension.types';

// ============================================================================
// LEGACY EXPORTS - Maintains backward compatibility
// All components now sourced from modular ui/ structure
// ============================================================================

// Widget Components
export {
  CollapsibleWidget,
  ModelInfoDisplay,
  ControlPanel,
  CameraPresetsWidget
} from './ui';

// Modal Components
export {
  ModelSelector,
  KeyboardShortcutsHelp
} from './ui/modals';

// Feedback Components
export {
  LoadingSpinner,
  LoadingProgress,
  ErrorMessage
} from './ui/feedback';

// Legacy compatibility exports (same as before)
export type { 
  ModelInfo, 
  ModelError,
  ControlPanelProps,
  ModelSelectorProps,
  ModelInfoDisplayProps,
  LoadingProgressProps,
  ErrorMessageProps,
  KeyboardShortcutsHelpProps,
  PerformanceHUDProps,
  CollapsibleWidgetProps,
  CameraPresetsWidgetProps
} from './Dimension.types';

export { 
  formatFileSize, 
  formatVertexCount, 
  formatPercentage 
} from './Dimension.utils';

// PerformanceHUD Component (Simplified - placeholder for future implementation)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PerformanceHUD({ isMobile: _isMobile }: PerformanceHUDProps) {
  return null;
}
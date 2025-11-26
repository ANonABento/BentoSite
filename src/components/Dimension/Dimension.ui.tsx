// Dimension.tsx - Enhanced UI Components with Improved Accessibility and Visual Design
// REFACTORED: Now uses modular component structure for better maintainability

// Import all types from types file
import type {
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

// Import utilities
import { formatFileSize, formatVertexCount, formatPercentage } from './Dimension.utils';

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

// PerformanceHUD Component (Simplified - as requested)
export function PerformanceHUD({ isMobile }: PerformanceHUDProps) {
  return null;
}
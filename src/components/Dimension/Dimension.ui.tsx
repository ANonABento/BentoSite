// Dimension.tsx - Enhanced UI Components with Improved Accessibility and Visual Design
// REFACTORED: Now uses modular component structure for better maintainability

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
  CollapsibleWidgetProps,
  CameraPresetsWidgetProps
} from './Dimension.types';

export {
  formatFileSize,
  formatVertexCount,
  formatPercentage
} from './Dimension.utils';

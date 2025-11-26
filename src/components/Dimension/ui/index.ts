// Main UI library exports
export { 
  CollapsibleWidget,
  ModelInfoDisplay,
  ControlPanel,
  CameraPresetsWidget 
} from './widgets';

export { 
  ModelSelector,
  KeyboardShortcutsHelp 
} from './modals';

export { 
  LoadingSpinner,
  LoadingProgress,
  ErrorMessage 
} from './feedback';

export { 
  DESIGN_SYSTEM,
  COMMON_CLASSES,
  formatFileSize,
  formatVertexCount,
  formatPercentage 
} from './shared';

// PerformanceHUD component (simplified)
export function PerformanceHUD({ isMobile }: { isMobile: boolean }) {
  return null;
}
/**
 * UI Component Library Barrel Exports
 * Import from '@/components/ui' for all shared UI components
 */

// Error handling
export { ErrorBoundary, InlineError } from './ErrorBoundary';
export type { ErrorBoundaryProps } from './ErrorBoundary';

// Loading states
export {
  LoadingSpinner,
  LoadingOverlay,
  LoadingDots,
  LoadingSkeleton,
} from './LoadingSpinner';
export type { SpinnerVariant, SpinnerSize } from './LoadingSpinner';
export { LazyPanelFallback } from './LazyPanelFallback';
export { RouteLoadingFallback } from './RouteLoadingFallback';

// Icons
export * from './Icons';

// Toast notifications
export { ToastProvider, useToast } from './Toast';

// Skeletons
export {
  Skeleton,
  ChatMessageSkeleton,
  ChatSkeleton,
  ViewerSkeleton,
  CardSkeleton,
  SkillsSkeleton,
  AboutSectionSkeleton,
  TimelineSectionSkeleton,
  ProjectsSectionSkeleton,
} from './Skeleton';

// Page transitions
export {
  PageTransition,
  PageTransitionItem,
  FadeTransition,
  SlideTransition,
} from './PageTransition';

// Other components
export { KeyboardShortcutsModal, useKeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
export { SectionHeader } from './SectionHeader';

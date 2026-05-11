// Dimension.tsx - Types and Interfaces

export type ModelFormat = 'stl' | 'gltf' | 'glb' | 'procedural';

export interface ModelInfo {
  id: string;
  name: string;
  path: string;
  thumbnail: string;
  // Optional metadata — undefined means "unknown" (e.g. a project-supplied
  // mesh whose dimensions we never measured). 0 is a valid value (procedural
  // meshes legitimately have no file size). The UI distinguishes the two.
  fileSize?: number;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  vertexCount?: number;
  description: string;
  category: string;
  format?: ModelFormat; // Optional, defaults to 'stl' for backwards compatibility
}

export interface ModelError {
  message: string;
  code?: string;
  retryable: boolean;
}

// Enhanced Control Panel Props with priority controls
export interface ControlPanelProps {
  autoRotate: boolean;
  isWireframe: boolean;
  isFullscreen?: boolean;
  onToggleAutoRotate: () => void;
  onToggleWireframe: () => void;
  onResetView: () => void;
  onZoomFit: () => void;
  onScreenshot: () => void;
  onFullscreen: () => void;
  onCameraPresets: () => void;
  onModelManager: () => void;
  /** Hide the "Models" tile + drop the M shortcut when only one model exists. */
  enableModelManager?: boolean;
  selectedModelName: string;
  isMobile: boolean;
  showCameraPresets?: boolean;
  // Slider controls
  zoomLevel: number;
  rotationSpeed: number;
  onZoomChange: (zoom: number) => void;
  onRotationSpeedChange: (speed: number) => void;
}

export interface ModelSelectorProps {
  models: ModelInfo[];
  selectedModel: ModelInfo;
  onModelSelect: (model: ModelInfo) => void;
  isMobile: boolean;
  onClose: () => void;
}

export interface ModelInfoDisplayProps {
  model: ModelInfo;
  isMobile: boolean;
}

export interface ResponsiveOrbitControlsProps {
  isMobile: boolean;
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
}

export interface STLModelWrapperProps {
  modelPath?: string;
  onError: (error: ModelError) => void;
  autoRotate: boolean;
  onClick: () => void;
  isWireframe: boolean;
  rotationSpeed?: number;
  isMobile: boolean;
}

export interface LODModelProps {
  modelPath?: string;
  autoRotate: boolean;
  onClick: () => void;
  isWireframe: boolean;
  rotationSpeed?: number;
  isMobile: boolean;
}

export interface BillboardTextProps {
  text: string;
  position: [number, number, number];
  color?: string;
  size?: number;
}

export interface FallbackModelProps {
  error?: ModelError;
}

export interface CollapsibleWidgetProps {
  title: string;
  icon: React.ReactNode;
  defaultPosition: { x: number; y: number };
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  children: React.ReactNode;
  className?: string;
  isMobile: boolean;
  autoPosition?: boolean;
}

export interface LoadingProgressProps {
  progress: number;
}

export interface ErrorMessageProps {
  error: ModelError;
  onRetry: () => void;
  isMobile: boolean;
}

export interface DimensionViewerProps {
  /** Hide all UI controls for minimal/landing page view */
  minimal?: boolean;
  /** Optional externally controlled model path */
  modelPath?: string;
}

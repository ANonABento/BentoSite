// Dimension.tsx - Types and Interfaces

export type ModelFormat = 'stl' | 'gltf' | 'glb';

export interface ModelInfo {
  id: string;
  name: string;
  path: string;
  thumbnail: string;
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  vertexCount: number;
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
  selectedModelName: string;
  isMobile: boolean;
  screenSize: { width: number; height: number };
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
  autoRotate: boolean;
  isMobile: boolean;
  rotationSpeed?: number;
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
}

export interface LODModelProps {
  modelPath?: string;
  autoRotate: boolean;
  onClick: () => void;
  isWireframe: boolean;
  rotationSpeed?: number;
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

export interface CameraPresetsWidgetProps {
  presets: Record<string, readonly [number, number, number]>;
  onPresetSelect: (preset: string) => void;
  onClose?: () => void;
  defaultPosition?: { x: number; y: number }; // Made optional for auto-positioning
  isMobile: boolean;
  autoPosition?: boolean; // Add autoPosition prop
}

export interface DimensionViewerProps {
  /** Hide all UI controls for minimal/landing page view */
  minimal?: boolean;
  /** Optional externally controlled model path */
  modelPath?: string;
}

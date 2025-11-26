# Dimension.tsx - 3D Model Viewer Component

A comprehensive, modular 3D model viewer component built with React Three Fiber, featuring advanced model management, responsive design, and professional portfolio integration.

## 📁 File Structure

This component has been refactored into **8 focused, maintainable files** for better organization and scalability:

```
src/components/Dimension/
├── README.md              # This file - component documentation
├── Dimension.tsx          # Main component and exports
├── Dimension.types.ts     # TypeScript interfaces and types
├── Dimension.config.ts    # Configuration and constants
├── Dimension.utils.ts     # Utility functions and helpers
├── Dimension.hooks.ts     # Custom React hooks
├── Dimension.ui.tsx       # UI components and interfaces
└── Dimension.3d.tsx       # Three.js and 3D components
```

## 🎯 Component Overview

**Primary Function**: Professional 3D model viewer for portfolio websites with:
- **Phase 1.6**: Model Management (Model Selector, Info Display, Switching)
- STL file loading with comprehensive error handling
- Mobile-responsive design with touch controls
- Performance optimization with LOD (Level of Detail)
- Keyboard shortcuts and accessibility features
- Loading states and progress indicators

## 📋 File Details

### `Dimension.tsx` - Main Component
- **Size**: ~150 lines (clean and focused)
- **Purpose**: Main `DimensionViewer` component entry point
- **Responsibilities**:
  - Centralized state management
  - Event handling and callbacks
  - Component orchestration
  - Import/export coordination
- **Key Features**:
  - Error boundary integration
  - Model switching logic
  - Performance optimization settings
  - Responsive canvas configuration

### `Dimension.types.ts` - Type Definitions
- **Purpose**: All TypeScript interfaces and type definitions
- **Contains**:
  ```typescript
  interface ModelInfo {
    id: string;
    name: string;
    path: string;
    fileSize: number;
    dimensions: { width, height, depth };
    vertexCount: number;
    category: string;
    description: string;
  }
  
  interface ModelError {
    message: string;
    code?: string;
    retryable: boolean;
  }
  
  // Component props interfaces
  interface ControlPanelProps { ... }
  interface ModelSelectorProps { ... }
  // ... and more
  ```
- **Benefits**: Centralized type safety, excellent IDE support, easy refactoring

### `Dimension.config.ts` - Configuration & Constants
- **Purpose**: Centralized configuration and model data
- **Contains**:
  ```typescript
  export const AVAILABLE_MODELS: ModelInfo[] = [
    // Model configuration with metadata
  ];
  
  export const CAMERA_POSITION = [8, 8, 8] as const;
  export const CAMERA_FOV = 50;
  export const GRID_SIZE = 20;
  export const ROTATION_SPEED_X = 0.2;
  // ... more constants
  ```
- **Benefits**: Easy to modify settings, centralized model management, performance tuning

### `Dimension.utils.ts` - Utility Functions
- **Purpose**: Helper functions and utilities
- **Contains**:
  ```typescript
  export const formatFileSize = (bytes: number): string => { ... };
  export const getCategoryColor = (category: string): string => { ... };
  export const isMobileDevice = (): boolean => { ... };
  export const getLODLevel = (distance, isMobile, fps): number => { ... };
  // ... more utilities
  ```
- **Benefits**: Reusable logic, testable functions, performance optimizations

### `Dimension.hooks.ts` - Custom React Hooks
- **Purpose**: Encapsulated React logic and side effects
- **Contains**:
  ```typescript
  export const useIsMobile = (): boolean => { ... };
  export const useKeyboardShortcuts = (callbacks) => { ... };
  export const useTouchGestures = (onPinchZoom) => { ... };
  export const usePerformanceMonitor = () => { fps, updateFps } => { ... };
  // ... more hooks
  ```
- **Benefits**: Reusable logic, testable hooks, separation of concerns

### `Dimension.ui.tsx` - UI Components
- **Purpose**: All user interface components
- **Contains**:
  ```typescript
  export function ModelSelector({ models, selectedModel, onModelSelect }) { ... }
  export function ModelInfoDisplay({ model, isMobile }) { ... }
  export function ControlPanel({ autoRotate, onToggleAutoRotate, ... }) { ... }
  export function LoadingSpinner() { ... }
  export function ErrorMessage({ error, onRetry, isMobile }) { ... }
  // ... more UI components
  ```
- **Features**:
  - Modal-based model selector with search and filtering
  - Responsive control panel with keyboard shortcuts
  - Professional loading and error states
  - Mobile-optimized interfaces

### `Dimension.3d.tsx` - Three.js Components
- **Purpose**: All Three.js and 3D rendering components
- **Contains**:
  ```typescript
  export function LODModel({ modelPath, autoRotate, onClick }) { ... }
  export function ResponsiveOrbitControls({ autoRotate, isMobile }) { ... }
  export function BillboardText({ text, position, color }) { ... }
  export function FallbackModel({ error }) { ... }
  export function StationaryBackground() { ... }
  // ... more 3D components
  ```
- **Features**:
  - Level of Detail (LOD) system for performance
  - Responsive controls for mobile/desktop
  - Error handling with fallback geometry
  - Professional lighting and shadows

## 🚀 Getting Started

### Basic Usage
```tsx
import DimensionViewer from '@/components/Dimension/Dimension';

export default function MyComponent() {
  return (
    <div className="w-full h-screen">
      <DimensionViewer />
    </div>
  );
}
```

### Adding New Models
Edit `Dimension.config.ts`:
```typescript
export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'my-model',
    name: 'My New Model',
    path: '/models/my-model.stl',
    thumbnail: '/models/thumbnails/my-model.png',
    fileSize: 125000,
    dimensions: { width: 15, height: 20, depth: 10 },
    vertexCount: 4200,
    description: 'Description of my 3D model',
    category: 'Custom'
  },
  // ... existing models
];
```

### Customizing Settings
Edit `Dimension.config.ts`:
```typescript
// Adjust camera settings
export const CAMERA_POSITION = [10, 10, 10]; // Further back
export const CAMERA_FOV = 60; // Wider view

// Modify performance thresholds
export const LOD_DISTANCE_DESKTOP_HIGH = 15; // More aggressive LOD
```

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `R` | Reset View |
| `Space` | Toggle Auto-Rotation |
| `W` | Toggle Wireframe View |
| `M` | Open Model Manager |
| `S` | Take Screenshot |
| `F` | Toggle Fullscreen |
| `Z` | Zoom to Fit |
| `P` | Toggle Performance HUD |
| `?` | Show Keyboard Shortcuts |

## 🔧 Features by Phase

### ✅ Phase 1.1-1.4: Core Features (Completed)
- Loading states and progress indicators
- Error handling with retry functionality
- Performance optimization with LOD
- Mobile support with touch controls

### ✅ Phase 1.5: Control Panel (Completed)
- Floating control panel with responsive design
- Keyboard shortcuts integration
- Visual feedback and tooltips

### ✅ Phase 1.6: Model Management (Completed)
- **Model Selector**: Modal with search and category filtering
- **Model Info Display**: File size, dimensions, vertex count
- **Model Switching**: Seamless transitions between models
- **Category System**: Organized model management

### 📋 Phase 1.7: Advanced Features (Future)
- Screenshot capture and download
- Fullscreen mode
- Preset camera positions
- 360° view export

## 🎨 Styling & Theme

The component uses **Tailwind CSS** with responsive classes:
- `bg-gray-900`, `text-white`, `backdrop-blur-sm`
- Mobile-first responsive design
- Dark theme optimized for 3D viewing
- Professional color scheme

## 📱 Mobile Support

- **Touch Controls**: Pinch-to-zoom, drag to rotate
- **Responsive UI**: Adaptive control panel layout
- **Performance**: LOD system, disabled shadows, reduced pixel ratio
- **Battery**: Auto-disable auto-rotation on mobile

## 🔄 Error Handling

Comprehensive error system with:
- **File Not Found**: 404 handling with retry
- **Invalid Format**: STL validation with fallback
- **Network Issues**: Connection error recovery
- **Fallback Geometry**: Red wireframe cube on error

## 🎯 Performance Optimizations

- **LOD System**: Distance-based detail reduction
- **Frustum Culling**: Automatic off-screen culling
- **Shadow Management**: Disabled on mobile, optimized on desktop
- **Memory Management**: Proper cleanup and disposal
- **FPS Monitoring**: Real-time performance tracking

## 📊 Model Requirements

### Supported Formats
- **STL** (primary): Binary and ASCII STL files
- **Future**: GLTF/GLB support planned

### Model Specifications
- **File Size**: Optimized for web delivery (<10MB recommended)
- **Dimensions**: Automatic scaling and centering
- **Vertices**: Performance scaling based on vertex count
- **Materials**: Standard materials with PBR support

## 🔧 Development

### Building and Testing
```bash
npm run build        # TypeScript compilation
npm run dev          # Development server
npm run lint         # Code linting
```

### Code Quality
- **TypeScript**: Strict type checking enabled
- **ESLint**: Airbnb configuration with React rules
- **Prettier**: Consistent code formatting
- **Modular Design**: Separation of concerns

## 🤝 Contributing

When adding new features:
1. **Identify the appropriate file** based on feature type
2. **Follow existing patterns** and naming conventions
3. **Add TypeScript interfaces** for new props/data
4. **Include mobile considerations** in responsive design
5. **Test error scenarios** and edge cases

### Adding New UI Components
1. Create component in `Dimension.ui.tsx`
2. Define props interface in `Dimension.types.ts`
3. Export from main component if needed
4. Add responsive classes with Tailwind CSS

### Adding New 3D Features
1. Create component in `Dimension.3d.tsx`
2. Consider mobile performance impact
3. Add error handling and fallback states
4. Follow Three.js best practices

## 📈 Future Enhancements

### Planned Features
- **AR/VR Support**: WebXR integration
- **Model Animations**: GLTF animation support
- **Advanced Lighting**: HDRI environment maps
- **Export Features**: Video recording, STL export
- **Analytics**: Usage tracking and heatmaps

### Scalability Considerations
- **Model Streaming**: Progressive loading for large files
- **Web Workers**: Background processing for model analysis
- **Caching**: Service worker for offline model access
- **CDN Integration**: Optimized asset delivery

---

**Status**: ✅ Production Ready | **Version**: 1.6 | **License**: MIT

For questions or contributions, please refer to the component architecture or existing implementation patterns.
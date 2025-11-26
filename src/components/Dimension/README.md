# Dimension.tsx - 3D Model Viewer Component

A comprehensive, modular 3D model viewer component built with React Three Fiber, featuring advanced model management, responsive design, and professional portfolio integration.

## 📁 File Structure

This component has been refactored into a **modular architecture** for better organization and scalability:

```
src/components/Dimension/
├── README.md                    # This file - component documentation
├── Dimension.tsx                # Main component and exports
├── Dimension.types.ts           # TypeScript interfaces and types
├── Dimension.config.ts          # Configuration and constants
├── Dimension.utils.ts           # Utility functions and helpers
├── Dimension.hooks.ts           # Custom React hooks
├── Dimension.ui.tsx             # UI component exports (modular structure)
├── ui/                          # Modular UI component library
│   ├── shared/                  # Design system & shared utilities
│   ├── widgets/                 # Draggable, collapsible widgets
│   ├── modals/                  # Modal dialogs
│   └── feedback/                # Loading, error, and feedback components
└── Dimension.3d.tsx             # Three.js and 3D components
```

## 🎯 Component Overview

**Primary Function**: Professional 3D model viewer for portfolio websites with:
- **Modular UI System**: Recently refactored for maintainability (14 component files)
- STL file loading with comprehensive error handling
- Mobile-responsive design with touch controls
- Performance optimization with LOD (Level of Detail)
- Keyboard shortcuts and accessibility features
- Loading states and progress indicators

## 🏗️ Architecture

### Core Files
- **`Dimension.tsx`** - Main component entry point (~150 lines)
- **`Dimension.types.ts`** - TypeScript interfaces and type definitions
- **`Dimension.config.ts`** - Configuration constants and model data
- **`Dimension.utils.ts`** - Utility functions and helpers
- **`Dimension.hooks.ts`** - Custom React hooks for state management

### UI System (Recently Refactored)
- **`ui/shared/`** - Design system constants and shared utilities
- **`ui/widgets/`** - CollapsibleWidget, ControlPanel, ModelInfoDisplay, CameraPresetsWidget
- **`ui/modals/`** - ModelSelector, KeyboardShortcutsHelp
- **`ui/feedback/`** - LoadingSpinner, LoadingProgress, ErrorMessage

### 3D System
- **`Dimension.3d.tsx`** - Three.js components (LODModel, ResponsiveOrbitControls, etc.)

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
```typescript
// Edit Dimension.config.ts
export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'my-model',
    name: 'My New Model',
    path: '/models/my-model.stl',
    description: 'Description of my 3D model',
    category: 'Custom'
  },
  // ... more models
];
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
| `?` | Show Keyboard Shortcuts |

## 🎨 Key Features

### ✅ **Completed Features**
- **Modular UI Architecture** - Recently refactored for maintainability
- Model management with selector and info display
- Loading states and comprehensive error handling
- Performance optimization with LOD system
- Mobile-responsive design with touch controls
- Keyboard shortcuts and accessibility

### 📋 **Future Enhancements**
- Screenshot capture and download
- Fullscreen mode
- Preset camera positions
- Advanced export features

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

## 🔧 Development

### Building and Testing
```bash
npm run build        # TypeScript compilation
npm run dev          # Development server
npm run lint         # Code linting
```

### Code Quality
- **TypeScript**: Strict type checking enabled
- **Modular Design**: Separation of concerns
- **Refactored UI**: 14 organized component files

## 🤝 Contributing

When adding new features:
1. **Identify the appropriate file** based on feature type
2. **Follow existing patterns** and naming conventions
3. **Add TypeScript interfaces** for new props/data
4. **Include mobile considerations** in responsive design
5. **Test error scenarios** and edge cases

### Adding New Components
- **UI Components**: Create in appropriate `ui/` subdirectory
- **3D Features**: Add to `Dimension.3d.tsx`
- **Hooks**: Add to `Dimension.hooks.ts`
- **Utilities**: Add to `Dimension.utils.ts`

## 📈 Status

**Status**: ✅ Production Ready  
**Architecture**: ✅ Modular UI System  
**Refactoring**: ✅ Complete  
**Version**: 2.0  

---

For questions or contributions, please refer to the component architecture or existing implementation patterns.
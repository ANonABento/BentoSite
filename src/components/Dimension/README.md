# Dimension 3D Model Viewer

A modular React Three Fiber viewer for portfolio models, with STL and GLTF/GLB loading, model selection, responsive controls, screenshots, fullscreen mode, and mobile-specific performance behavior.

## File Structure

```text
src/components/Dimension/
├── index.ts                    # Public viewer barrel
├── Dimension.tsx               # Thin viewer shell and UI composition
├── Dimension.viewport.tsx      # Canvas setup and viewport composition
├── useDimensionController.ts   # Viewer state, refs, shortcuts, and actions
├── Dimension.types.ts          # Public and feature-local TypeScript types
├── Dimension.config.ts         # Model definitions and camera constants
├── Dimension.hooks.ts          # Small responsive and shortcut hooks
├── Dimension.utils.ts          # Utility functions
├── Dimension.ui.tsx            # UI implementation barrel
├── scene/                      # Three.js scene primitives and model loaders
│   ├── index.ts
│   ├── constants.ts
│   ├── model-format.ts
│   ├── ModelWrapper.tsx
│   ├── LODModel.tsx
│   ├── GLTFModel.tsx
│   ├── BillboardText.tsx
│   ├── SkeletonLoader.tsx
│   ├── SceneErrorBoundary.tsx
│   ├── FallbackModel.tsx
│   ├── ResponsiveOrbitControls.tsx
│   └── StationaryBackground.tsx
└── ui/                         # Widgets, modals, feedback, and shared UI
```

## Public Usage

Import the viewer through the root barrel:

```tsx
import DimensionViewer from '@/components/Dimension';

export default function MyComponent() {
  return (
    <div className="w-full h-screen">
      <DimensionViewer />
    </div>
  );
}
```

The public props are:

```ts
interface DimensionViewerProps {
  minimal?: boolean;
  modelPath?: string;
}
```

Three.js consumers should continue to disable SSR at the caller boundary:

```tsx
const DimensionViewer = dynamic(() => import('@/components/Dimension'), {
  ssr: false,
});
```

## Architecture

- `Dimension.tsx` composes the viewer UI and keeps `minimal` display gates close to rendering.
- `useDimensionController.ts` owns selected model state, fullscreen, screenshot, zoom, camera presets, keyboard shortcuts, mobile defaults, and refs.
- `Dimension.viewport.tsx` owns the `<Canvas>` configuration, loading fallback, error canvas, lights, controls, and model wrapper placement.
- `scene/` contains focused Three.js primitives. `ModelWrapper` keeps Suspense and chooses between STL and GLTF/GLB loaders.
- `ui/` contains model selector, loading/error feedback, camera controls, shared design tokens, and viewer widgets.

## Adding Models

Edit `Dimension.config.ts`:

```ts
export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'my-model',
    name: 'My New Model',
    path: '/models/my-model.stl',
    description: 'Description of my 3D model',
    category: 'Custom',
    thumbnail: '',
    fileSize: 0,
    dimensions: { width: 0, height: 0, depth: 0 },
    vertexCount: 0,
  },
];
```

Supported model formats are STL and GLTF/GLB. Paths ending in `.gltf` or `.glb` use the GLTF loader; all other paths use the STL loader.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `R` | Reset camera |
| `Space` | Toggle auto-rotation |
| `W` | Toggle wireframe |
| `S` | Screenshot |
| `F` | Fullscreen |
| `C` | Toggle camera presets |
| `Z` | Zoom to fit |

## Development

```bash
npm run type-check
npm run lint
npm test
npm run build
```

When adding to this feature:

1. Keep public imports rooted at `@/components/Dimension`.
2. Keep scene internals under `scene/`.
3. Preserve `gl={{ preserveDrawingBuffer: true }}` for screenshots.
4. Keep mobile behavior in mind: capped pixel ratio, disabled shadows, touch controls, and mobile model-info defaults.

# InfiniteGrid v2

Physics-enabled infinite canvas for displaying portfolio projects with a bento grid layout.

## Overview

InfiniteGrid provides an interactive, visually engaging way to browse projects:
- **Canvas-based navigation**: Pan and zoom the entire view
- **Sticky search card**: Search and filter that sticks to viewport edges
- **Physics interactions**: Cards naturally collide and flow around obstacles
- **Smart bento layout**: Projects arranged in varied sizes for visual interest

## Architecture

```
InfiniteGrid/
├── InfiniteGrid.tsx       # Main modal component
├── InfiniteGrid.types.ts  # TypeScript interfaces
├── InfiniteGrid.constants.ts # Configuration
│
├── canvas/
│   ├── useCanvas.ts       # Pan/zoom state & gestures
│   └── transforms.ts      # Coordinate conversion utilities
│
├── layout/
│   ├── algorithm.ts       # Bento packing algorithm
│   ├── transitions.ts     # Layout change detection
│   └── useBentoLayout.ts  # Layout calculation hook
│
├── physics/
│   ├── engine.ts          # Matter.js setup
│   ├── forces.ts          # Force calculations
│   └── usePhysicsWorld.ts # Physics integration hook
│
├── cards/
│   ├── SearchCard.tsx     # Sticky search with controls
│   └── ProjectCard.tsx    # Project display card
│
└── __tests__/
    ├── transforms.test.ts
    ├── algorithm.test.ts
    └── transitions.test.ts
```

## Usage

```tsx
import { InfiniteGrid } from '@/components/InfiniteGrid';

function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <InfiniteGrid
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onSelectProject={(project) => console.log(project)}
    />
  );
}
```

## Key Features

### Canvas Navigation

- **Pan**: Drag to move the view
- **Zoom**: Scroll wheel or pinch gesture
- **Momentum**: Release after dragging for momentum scrolling
- **Keyboard**: WASD/arrows to pan, +/- to zoom, R to reset

### Sticky Search Card

The search card starts in the canvas center. When panning moves it near a viewport edge, it "sticks" to that edge and becomes fixed while the canvas continues to pan. Cards flow around the stuck search card using physics.

```
Initial:              Pan left:              Keep panning:

[cards] [search]     [cards] [search]|      [cards] →  [search]|
[cards] [cards]      [cards] [cards] |      [more cards]  STUCK
                             ^edge                         ^edge
```

### Physics

Built on Matter.js with:
- **Collisions**: Cards and search card are real physics bodies
- **Settling**: When filtering, cards smoothly settle to new positions
- **Wake/Sleep**: Bodies sleep when stationary to save CPU

### Hybrid Animation

When filtering changes the visible projects:
1. **Removed cards**: Fade out (250ms)
2. **Kept cards**: Physics settle to new positions
3. **Added cards**: Fade in after settling (300ms delay)

## Configuration

Key constants in `InfiniteGrid.constants.ts`:

| Constant | Default | Description |
|----------|---------|-------------|
| `CAMERA.minZoom` | 0.3 | Minimum zoom level |
| `CAMERA.maxZoom` | 2.5 | Maximum zoom level |
| `STICKY.threshold` | 60 | Edge trigger distance (px) |
| `GRID.cellSize` | 200 | Base card size (px) |
| `GRID.columns` | 6 | Number of grid columns |
| `PHYSICS.restitution` | 0.4 | Bounce factor on collision |

## Card Sizes

Cards are assigned sizes for visual variety:

| Size | Columns | Rows | Used For |
|------|---------|------|----------|
| `2x2` | 2 | 2 | Featured projects |
| `2x1` | 2 | 1 | Varied layout |
| `1x2` | 1 | 2 | Varied layout |
| `1x1` | 1 | 1 | Default |

## Performance

Optimizations included:
- **Viewport culling**: Only render visible cards
- **Physics throttling**: React state updates at 30fps
- **Spatial hashing**: O(1) visibility checks
- **3D suspension**: Dashboard 3D viewer pauses when grid opens

## Testing

```bash
npm test -- --run src/components/InfiniteGrid
```

Tests cover:
- Coordinate transforms (canvas ↔ screen)
- Bento layout algorithm
- Layout transition detection

## Dependencies

- `matter-js` - Physics engine
- `@use-gesture/react` - Gesture handling
- `framer-motion` - Animations

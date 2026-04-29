# Infinite Bento Grid - Implementation Plan

## Overview

Replace the current `ProjectsModal` with an infinite physics-based canvas where project cards have realistic physics (collision, momentum), and a morphing search card that sticks to edges when scrolling.

---

## Requirements Summary

| Feature | Details |
|---------|---------|
| **Canvas** | Infinite 2D draggable space, full-screen modal |
| **Physics** | Matter.js for rigid body collision, fluid + snappy feel |
| **Search** | Centered card → morphs to edge bar when scrolled off-screen |
| **Navigation** | Drag anywhere, WASD/arrows, scroll to pan, pinch to zoom |
| **Cards** | Click navigates to `/projects/[id]`, drag detected separately |
| **Layout** | Grid formation initially, physics on interaction |
| **Persistence** | Camera position saved to localStorage |
| **Scale** | Optimized for 50+ projects with virtualization |

---

## Technical Architecture

### Libraries

```json
{
  "dependencies": {
    "matter-js": "^0.20.0",
    "@use-gesture/react": "^10.3.0",
    "framer-motion": "existing"
  },
  "devDependencies": {
    "@types/matter-js": "^0.19.7"
  }
}
```

### File Structure

```
src/components/InfiniteGrid/
├── index.ts                    # Barrel export
├── InfiniteGrid.tsx            # Main component - viewport & orchestration
├── InfiniteGrid.types.ts       # TypeScript interfaces
├── InfiniteGrid.physics.ts     # Matter.js world setup & collision handling
├── InfiniteGrid.hooks.ts       # useCamera, usePhysicsSync, useGestures
├── InfiniteGrid.search.tsx     # Morphing search card component
├── InfiniteGrid.card.tsx       # Physics-enabled project card wrapper
├── InfiniteGrid.spatial.ts     # Spatial hash for virtualization
└── InfiniteGrid.constants.ts   # Physics configs, thresholds
```

---

## Implementation Tasks

### Phase 1: Foundation (Core Canvas)

#### Task 1.1: Type Definitions
**File:** `InfiniteGrid.types.ts`

```typescript
interface Camera {
  x: number;
  y: number;
  zoom: number;
}

interface PhysicsBody {
  id: string;
  matterBody: Matter.Body;
  type: 'project' | 'search';
}

interface GridConfig {
  cellSize: number;           // Base grid cell size
  columns: number;            // Initial grid columns
  gap: number;                // Gap between cards
  cardSizes: CardSize[];      // Bento size variations
}

type CardSize = '1x1' | '2x1' | '1x2' | '2x2';
```

#### Task 1.2: Constants & Configuration
**File:** `InfiniteGrid.constants.ts`

```typescript
export const PHYSICS = {
  friction: 0.05,
  frictionAir: 0.02,
  restitution: 0.3,         // Bounciness
  density: 0.001,
  sleepThreshold: 60,
};

export const CAMERA = {
  minZoom: 0.5,
  maxZoom: 2.0,
  panSpeed: 15,             // WASD speed
  scrollPanSpeed: 1,        // Scroll wheel speed
  momentum: { friction: 0.92, minVelocity: 0.1 },
};

export const INTERACTION = {
  dragThreshold: 5,         // px before drag vs click
  clickMaxDuration: 200,    // ms max for a click
};
```

#### Task 1.3: Camera Hook
**File:** `InfiniteGrid.hooks.ts`

```typescript
function useCamera(initialPosition?: Camera) {
  // Load from localStorage or default to center
  // Expose: camera, setCamera, pan, zoom, reset
  // Save to localStorage on change (debounced)
}
```

#### Task 1.4: Gesture Handling
**File:** `InfiniteGrid.hooks.ts`

```typescript
function useCanvasGestures(camera, setCamera) {
  // @use-gesture/react bindings:
  // - useDrag: pan camera on background drag
  // - usePinch: zoom in/out
  // - useWheel: scroll to pan (shift+scroll for zoom?)
  // Returns bind() function for container
}

function useKeyboardNavigation(camera, setCamera) {
  // WASD / Arrow key handling
  // useEffect with keydown listener
}
```

#### Task 1.5: Main Container Component
**File:** `InfiniteGrid.tsx`

```typescript
export function InfiniteGrid({ isOpen, onClose }) {
  const { camera, pan, zoom } = useCamera();
  const gestureBindings = useCanvasGestures(camera, pan, zoom);

  // Transform style based on camera
  const transformStyle = {
    transform: `scale(${camera.zoom}) translate(${camera.x}px, ${camera.y}px)`
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-[var(--overlay-strong)]">
          <div
            {...gestureBindings()}
            style={transformStyle}
            className="infinite-canvas"
          >
            {/* Cards rendered here */}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

---

### Phase 2: Physics Engine

#### Task 2.1: Matter.js World Setup
**File:** `InfiniteGrid.physics.ts`

```typescript
export function createPhysicsWorld() {
  const engine = Matter.Engine.create({
    enableSleeping: true,
  });

  // Disable gravity (we want free-floating)
  engine.gravity.y = 0;
  engine.gravity.x = 0;

  return engine;
}

export function createCardBody(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number
): Matter.Body {
  return Matter.Bodies.rectangle(x, y, width, height, {
    label: id,
    friction: PHYSICS.friction,
    frictionAir: PHYSICS.frictionAir,
    restitution: PHYSICS.restitution,
    density: PHYSICS.density,
  });
}
```

#### Task 2.2: Physics-React Sync Hook
**File:** `InfiniteGrid.hooks.ts`

```typescript
function usePhysicsWorld(projects: Project[]) {
  const engineRef = useRef<Matter.Engine>();
  const bodiesRef = useRef<Map<string, Matter.Body>>();
  const [positions, setPositions] = useState<Map<string, {x: number, y: number, angle: number}>>();

  // Initialize engine and bodies on mount
  // RAF loop to sync Matter.js positions → React state
  // Return: positions map, applyForce function
}
```

#### Task 2.3: Draggable Card Wrapper
**File:** `InfiniteGrid.card.tsx`

```typescript
function PhysicsCard({
  project,
  position,
  onDragStart,
  onDragEnd
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Track pointer down position
  // On pointer up: check distance moved
  // If < DRAG_THRESHOLD: it's a click → navigate
  // If >= DRAG_THRESHOLD: it was a drag → apply velocity to physics body

  return (
    <motion.div
      style={{
        position: 'absolute',
        transform: `translate(${position.x}px, ${position.y}px) rotate(${position.angle}rad)`
      }}
      // ... gesture bindings
    >
      <ProjectCardContent project={project} />
    </motion.div>
  );
}
```

#### Task 2.4: Click vs Drag Detection
**File:** `InfiniteGrid.card.tsx`

```typescript
function useClickVsDrag(onDrag, onClick) {
  const startPos = useRef({ x: 0, y: 0, time: 0 });

  const handlePointerDown = (e) => {
    startPos.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handlePointerUp = (e) => {
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    const distance = Math.sqrt(dx*dx + dy*dy);
    const duration = Date.now() - startPos.current.time;

    if (distance < DRAG_THRESHOLD && duration < CLICK_MAX_DURATION) {
      onClick();
    }
    // Drag end handled separately with velocity
  };

  return { handlePointerDown, handlePointerUp };
}
```

---

### Phase 3: Search Card with Morphing

#### Task 3.1: Search Card Component
**File:** `InfiniteGrid.search.tsx`

```typescript
function MorphingSearchCard({
  camera,
  onSearch,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory
}) {
  const [morphState, setMorphState] = useState<'center' | 'top' | 'left' | 'right' | 'bottom'>('center');

  // Calculate if search card center position is outside viewport
  // Determine which edge it's closest to
  // Animate morph to that edge
}
```

#### Task 3.2: Edge Detection Logic
**File:** `InfiniteGrid.search.tsx`

```typescript
function useSearchMorphState(camera: Camera, viewportSize: { w: number, h: number }) {
  // Search card is always at canvas (0, 0)
  // Convert to screen coordinates using camera
  const screenPos = canvasToScreen({ x: 0, y: 0 }, camera);

  // Check if center of search card is in viewport
  const BUFFER = 50; // px before morphing

  if (screenPos.x < -BUFFER) return 'left';
  if (screenPos.x > viewportSize.w + BUFFER) return 'right';
  if (screenPos.y < -BUFFER) return 'top';
  if (screenPos.y > viewportSize.h + BUFFER) return 'bottom';
  return 'center';
}
```

#### Task 3.3: Morph Animation
**File:** `InfiniteGrid.search.tsx`

```typescript
// Framer Motion variants for morphing
const searchVariants = {
  center: {
    position: 'absolute',
    width: 320,
    height: 200,
    borderRadius: 16,
    // Full card styles
  },
  top: {
    position: 'fixed',
    top: 0,
    left: '50%',
    width: 400,
    height: 48,
    borderRadius: '0 0 12px 12px',
    transform: 'translateX(-50%)',
    // Collapsed bar styles
  },
  // ... left, right, bottom variants
};
```

#### Task 3.4: Search as Physics Body
- Search card is a **static** Matter.js body (mass = Infinity)
- Project cards collide with it and flow around
- When morphed to edge, the static body moves off-canvas

---

### Phase 4: Layout & Virtualization

#### Task 4.1: Initial Grid Layout
**File:** `InfiniteGrid.utils.ts`

```typescript
function calculateInitialLayout(projects: Project[]): Map<string, Position> {
  // Bento grid layout algorithm
  // Mix of 1x1, 2x1, 1x2, 2x2 cards based on project.featured or random
  // Center the grid around (0, 0)
  // Leave space in center for search card

  const layout = new Map();
  const CELL_SIZE = 200;
  const GAP = 16;
  const COLUMNS = Math.ceil(Math.sqrt(projects.length));

  // Grid packing algorithm (like CSS grid auto-flow: dense)
  // ...

  return layout;
}
```

#### Task 4.2: Spatial Hash for Virtualization
**File:** `InfiniteGrid.spatial.ts`

```typescript
class SpatialHash {
  private cellSize: number;
  private cells: Map<string, Set<string>>;

  constructor(cellSize = 500) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  insert(id: string, bounds: { x: number, y: number, w: number, h: number }) {
    // Add to all cells that overlap this bounds
  }

  query(viewport: { x: number, y: number, w: number, h: number }): string[] {
    // Return all IDs in cells that overlap viewport + buffer
  }
}
```

#### Task 4.3: Viewport Culling
**File:** `InfiniteGrid.tsx`

```typescript
// Only render cards visible in viewport + buffer
const visibleProjectIds = useMemo(() => {
  const viewportBounds = {
    x: -camera.x - BUFFER,
    y: -camera.y - BUFFER,
    w: (windowWidth / camera.zoom) + BUFFER * 2,
    h: (windowHeight / camera.zoom) + BUFFER * 2,
  };
  return spatialHash.query(viewportBounds);
}, [camera, spatialHash]);
```

---

### Phase 5: Navigation & Persistence

#### Task 5.1: Project Route & Navigation
- Create `/projects/[id]/page.tsx` route
- On card click: `router.push(/projects/${project.id})`
- Page shows ViewFinder with project media pre-filled

#### Task 5.2: localStorage Persistence
**File:** `InfiniteGrid.hooks.ts`

```typescript
const STORAGE_KEY = 'infinite-grid-camera';

function useCamera() {
  const [camera, setCamera] = useState<Camera>(() => {
    if (typeof window === 'undefined') return DEFAULT_CAMERA;
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_CAMERA;
  });

  // Debounced save to localStorage
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(camera));
    }, 500);
    return () => clearTimeout(timeout);
  }, [camera]);

  return { camera, setCamera, reset: () => setCamera(DEFAULT_CAMERA) };
}
```

#### Task 5.3: Reset Position Button
- Add a "Reset View" button (fixed position)
- Resets camera to `{ x: 0, y: 0, zoom: 1 }` with spring animation

---

### Phase 6: Polish & Mobile

#### Task 6.1: Mobile Optimizations
```typescript
const isMobile = useIsMobile();

const mobileConfig = {
  // Larger touch targets
  cardMinSize: 160, // vs 120 on desktop
  // Simplified physics
  frictionAir: 0.05, // vs 0.02 (faster settling)
  // Capped rendering
  maxVisibleCards: 20, // vs 50
};
```

#### Task 6.2: Touch Gestures
- Two-finger pan (already via @use-gesture)
- Pinch zoom (already via @use-gesture)
- Tap vs drag detection (same as click vs drag)

#### Task 6.3: Accessibility
- Focus management for keyboard navigation
- Announce card count on open
- Skip link to search
- Reduced motion: disable physics animations

#### Task 6.4: Close Button & Escape
- Fixed close button (top-right)
- Escape key to close modal
- Click outside infinite area to close (backdrop)

---

## Migration from ProjectsModal

1. Keep `ProjectsModal` temporarily
2. Build `InfiniteGrid` alongside it
3. Feature flag to switch between them
4. Once stable, delete `ProjectsModal`

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Initial render | < 100ms |
| 60fps during drag | Yes, with physics running |
| Memory (50 projects) | < 50MB |
| Time to interactive | < 500ms |

---

## Open Questions

1. **Card sizes**: Should we use fixed bento sizes (1x1, 2x1, 2x2) or let cards be dynamic based on content?

2. **Categories**: Should categories be visual clusters, or just filter via search?

3. **Featured projects**: Should featured projects be larger (2x2) automatically?

---

## Estimated Complexity

| Phase | Files | Effort |
|-------|-------|--------|
| Phase 1: Foundation | 4 | Medium |
| Phase 2: Physics | 3 | High |
| Phase 3: Search morph | 1 | Medium |
| Phase 4: Layout/virtualization | 2 | Medium |
| Phase 5: Navigation | 2 | Low |
| Phase 6: Polish | 1 | Medium |

Total: ~8-10 new files, significant complexity in physics integration.

---

## Ready to Start?

If this plan looks good, I'll begin implementation with Phase 1 (Foundation).

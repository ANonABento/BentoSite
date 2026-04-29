# BentoGrid System — Developer Handoff

## 1. Architecture Overview

```
BentoGrid/
  BentoGrid.tsx            # Entry point — picks Desktop vs Mobile by breakpoint
  BentoGrid.types.ts       # All shared type definitions
  BentoGrid.constants.ts   # All tunable constants (grid, camera, physics, search, themes)
  index.ts                 # Public API re-exports
  core/                    # Hooks: camera, card pool, viewport, spawn, keyboard nav
  physics/                 # Matter.js engine wrapper, forces, settling
  layout/                  # Position calculation, spiral placement, exclusion zones
  search/                  # Search card component, state hook, physics bridge
  cards/                   # Visual card components (BaseCard, GameCard, ProjectCard)
  views/                   # DesktopCanvasView (infinite canvas) and MobileScrollView (vertical scroll)
  __tests__/               # Unit tests
```

## 2. Key Files

| File | Purpose |
|------|---------|
| `BentoGrid.tsx` | Entry point. Picks desktop vs mobile view by window width. |
| `BentoGrid.types.ts` | All shared types: CardData, CardPosition, Camera, SearchCardState, physics types. |
| `BentoGrid.constants.ts` | All numeric constants: grid sizing, camera limits, physics config, themes. |
| `core/useCamera.ts` | Pan/zoom/momentum via @use-gesture/react. WASD keyboard pan, pinch zoom. |
| `core/useCardPool.ts` | FIFO visible/queue card pool. Manages which cards are on screen vs waiting. |
| `core/useSpawnManager.ts` | Detects camera movement, spawns cards from opposite edge, despawns off-viewport. |
| `core/useViewport.ts` | Screen-to-canvas transforms. Viewport bounds. Spawn position generation. |
| `core/useCardNavigation.ts` | Arrow key focus, Tab cycling, Enter/Space select. |
| `physics/engine.ts` | Matter.js wrapper. Zero gravity. Body CRUD. syncBodiesWithLayouts(). |
| `physics/forces.ts` | Settling spring forces, entrance burst, damping. |
| `physics/usePhysicsWorld.ts` | React hook bridging physics engine to component lifecycle. 16ms interval. |
| `layout/positions.ts` | Spiral placement algorithm. Initial card positioning. |
| `layout/exclusion.ts` | Layout with exclusion zone around stuck search card. |
| `search/SearchCard.tsx` | Visual search card. Breadcrumb, input, category pills, compression states. |
| `search/useSearchCardState.ts` | Edge detection + proportional compression math. |
| `search/searchPhysics.ts` | Search card as static/dynamic physics body. |
| `cards/BaseCard.tsx` | Shared motion wrapper with spring entrance/exit, hover scale. |
| `cards/ProjectCard.tsx` | Premium card: thumbnail, status badge, tech badges, hover links. |
| `cards/GameCard.tsx` | Synthwave card: neon borders, scanlines, pixel corners, best score. |
| `views/DesktopCanvasView.tsx` | Orchestrates all hooks. Renders canvas + cards + search overlay. |
| `views/MobileScrollView.tsx` | Simple vertical scroll list. No physics. |

## 3. Data Flow

```
CardData[] (props)
  → useCardPool → visible Map + queue
  → calculateInitialPositions() (spiral layout)
  → calculateLayoutWithExclusion() (if search stuck)
  → usePhysicsWorld(layouts) → Map<id, PhysicsPosition>
  → DesktopCardLayer merges layout + physics → renderCard()

useSpawnManager: on camera move →
  despawn off-screen (removeVisible + enqueue)
  spawn from queue at opposite edge (dequeue + addVisible + physics burst)
```

## 4. Physics System

- **Engine**: Matter.js, zero gravity, sleeping enabled, 60fps
- **Bodies**: Rectangle per card, chamfer 16. Search card id = `__search__`
- **Settling**: Spring force toward target position every 16ms. Strength: 0.002
- **Entrance burst**: Radial impulse away from center on spawn. Strength 8.
- **Collision**: restitution 0.7 (bouncy). Search card becomes static when stuck.
- **Sync**: `syncBodiesWithLayouts()` reconciles body set with layout map

## 5. Camera / Viewport

- **State**: `{ x, y, zoom }` — offset in canvas space
- **Drag**: @use-gesture, delta/zoom, momentum on release (0.92 friction/frame)
- **Zoom**: Pinch + wheel, focal-point zoom, range 0.4–2.0
- **Keyboard**: WASD pan 30px/frame, +/- zoom, R reset
- **Transforms**: `screenToCanvas()`, `canvasToScreen()`, `getCameraTransform()` (CSS)

## 6. Card Pool

- **FIFO queue**: Cards not visible wait ordered by timestamp
- **Initial**: 12 cards via spiral placement, rest queued
- **Max visible**: 30
- **Spawn**: On camera move, dequeue from front, place at opposite edge, entrance burst
- **Despawn**: Cards outside viewport + 200px buffer → removed + enqueued
- **Filter**: `applyFilter()` resets entire pool from filtered card set

## 7. Search Card

- **Position**: Canvas origin (0,0). Size 372×180 (2×1)
- **Sticky**: When screen rect exceeds viewport edge → compression proportional to overshoot
- **Top/bottom edge**: Height → 56px, filter pills fade out
- **Left/right edge**: Width → 80px, input hidden, icon only
- **Physics**: compression > 0 → static body (wall). compression = 0 → dynamic body
- **Exclusion zone**: When stuck, layout recalculates around 24px padded exclusion rect

## 8. Card Types

| Component | Theme | Key Features |
|-----------|-------|-------------|
| BaseCard | any | Motion wrapper, spring entrance/exit, hover scale 1.015 |
| ProjectCard | premium | Thumbnail, status badge, tech badges, hover links |
| GameCard | playful | Neon borders, scanlines, pixel corners, localStorage score |
| SearchCard | any | Fixed overlay, search/filter, edge compression |

## 9. Themes

| Property | playful | premium |
|----------|---------|---------|
| Background | Radial gradient | Linear gradient |
| Card bg | Purple-to-orange gradient | Glass bg |
| Border | 2px solid purple | 1px solid glass |
| Border radius | 20 | 8 |
| Shadow | Neon glow | Subtle |
| Rotation | ±3° | 0° |

Theme selected via `theme: 'playful' | 'premium'` prop.

## 10. Desktop vs Mobile

- **Desktop** (≥768px): Infinite canvas, physics, spawn/despawn, keyboard nav, FIFO recycling
- **Mobile** (<768px): Vertical scroll list, no physics, all cards rendered, fixed search at top

## 11. Known Issues / TODOs

- Search card animations inconsistent with regular cards
- ProjectCard and GameCard don't use BaseCard (duplicate animation logic)
- Duplicate search card implementations (cards/ + search/)
- Layout uses spiral, not true bento grid-snapping
- Edge-squash transitions need polish
- Cards don't truly flow around stuck search card via collision (uses exclusion zone instead)

## 12. How to Add a New Card Type

1. Define interface in `BentoGrid.types.ts` extending `BaseCardData`
2. Add to `CardData` union type
3. Create component in `cards/` following ProjectCard pattern
4. Optionally update `getCardSizeForIndex()` in `layout/cardSizes.ts`
5. Route in `renderCard` prop or update `DefaultCard`
6. Export from `cards/index.ts` and `BentoGrid/index.ts`

## 13. How to Modify Physics

- **Tuning**: Edit `BentoGrid.constants.ts` → `PHYSICS.*`
- **Settling strength**: `PHYSICS.settlingStrength` (0.002 default)
- **Bounciness**: `PHYSICS.restitution` (0.7 default)
- **New forces**: Add to `forces.ts`, call from `usePhysicsWorld.ts` interval
- **Disable**: Pass `enabled: false` to `usePhysicsWorld`

## 14. Key Constants

| Constant | Value |
|----------|-------|
| GRID.CELL_SIZE | 180px |
| GRID.GAP | 12px |
| GRID.DESPAWN_BUFFER | 200px |
| QUEUE.MAX_VISIBLE | 30 |
| QUEUE.INITIAL_SPAWN_COUNT | 12 |
| QUEUE.SPAWN_DELAY | 100ms |
| CAMERA.MIN_ZOOM / MAX_ZOOM | 0.4 / 2.0 |
| CAMERA.MOMENTUM_FRICTION | 0.92 |
| SEARCH_CARD.EXPANDED_WIDTH | 372px |
| SEARCH_CARD.COLLAPSED_HEIGHT | 56px |
| SEARCH_CARD.SQUASHED_SIDE_WIDTH | 80px |
| PHYSICS.settlingStrength | 0.002 |
| PHYSICS.restitution | 0.7 |
| ANIMATION.SPRING | stiffness: 180, damping: 25 |
| MOBILE.BREAKPOINT | 768px |
| Card size pattern | [1x1, 1x1, 2x1, 1x1, 1x2, 1x1, 1x1, 1x1] |

# BentoGrid Refactor Spec — Consolidated Physics Grid

Reference: [grid-refactor-requirements.md](grid-refactor-requirements.md) (drift check)

Status: BentoGrid is now the active shared grid for `/projects` and `/playground`. This spec remains as the implementation reference and drift checklist while search-card polish and cleanup continue.

## Goal

Consolidate `InfiniteGrid/` and `UnifiedGrid/` into a single `BentoGrid/` system that combines the best of both:
- **From InfiniteGrid**: Matter.js physics engine, real collision detection, sticky search card as physics wall, conditional physics, entrance burst
- **From UnifiedGrid**: Card queue/spawn system, edge compression math, desktop/mobile views, keyboard navigation, theme system, game cards

## Current State

| Feature | InfiniteGrid | UnifiedGrid | Target |
|---------|-------------|-------------|--------|
| Physics engine | Matter.js | None (CSS springs) | Matter.js |
| Collision detection | Yes (rigid body) | None | Yes |
| Search card sticky | Physics wall | Fixed overlay | Physics wall + compression |
| Card queue/pool | No (layout diff) | Yes (FIFO queue) | Queue |
| Spawn/despawn | Layout transitions | Edge-based spawn | Edge-based spawn |
| Edge compression | No (just clamp) | Yes (proportional) | Yes |
| Camera/pan/zoom | @use-gesture | Pointer + framer-motion | @use-gesture |
| Keyboard nav | WASD/arrows/zoom | WASD + card focus | Both |
| Mobile view | No | Yes (scroll fallback) | Yes |
| Themes | No | Yes (playful/premium) | Yes |
| Card types | Project, Search | Project, Game, Search | All |
| Entrance animation | Physics burst | Spring stagger | Physics burst |
| Tests | 3 files | 4 files | Merged + expanded |

## Architecture

```
src/components/BentoGrid/
├── index.ts                    # Public exports
├── BentoGrid.tsx               # Root: mobile detection, delegates to view
├── BentoGrid.types.ts          # Consolidated types
├── BentoGrid.constants.ts      # Consolidated constants
│
├── core/
│   ├── useCamera.ts            # Pan/zoom/momentum (@use-gesture, from InfiniteGrid)
│   ├── useCardPool.ts          # Card queue: visible + waiting, spawn/despawn (from UnifiedGrid, renamed)
│   ├── useViewport.ts          # Viewport bounds, coordinate transforms (merge both)
│   ├── useSpawnManager.ts      # Tick loop: despawn off-screen, spawn on edge (from UnifiedGrid)
│   └── useCardNavigation.ts    # Arrow/Tab keyboard focus (from UnifiedGrid)
│
├── physics/
│   ├── engine.ts               # Matter.js wrapper (from InfiniteGrid)
│   ├── forces.ts               # Settling, damping, entrance burst (from InfiniteGrid)
│   └── usePhysicsWorld.ts      # Bind engine to card pool changes (from InfiniteGrid)
│                                # Key change: physics ALWAYS on (not just when clamped)
│                                # Cards settle toward queue-assigned positions
│                                # Search card becomes static body when stuck
│
├── layout/
│   ├── positions.ts            # Spiral/radial initial placement (merge both algorithms)
│   ├── exclusion.ts            # Layout with exclusion zone around stuck search card
│   └── cardSizes.ts            # Size pattern logic (1x1, 2x1, etc.)
│
├── cards/
│   ├── SearchMenuCard.tsx       # Search UI + edge-compression presentation
│   ├── ProjectCard.tsx          # Merge best of both (UnifiedGrid version + InfiniteGrid hover)
│   ├── GameCard.tsx             # From UnifiedGrid (playful theme)
│   ├── BaseCard.tsx             # Shared card shell (border, shadow, hover, entrance anim)
│   └── DefaultCard.tsx          # Fallback
│
├── views/
│   ├── DesktopCanvasView.tsx    # Desktop: canvas + physics + all hooks wired
│   └── MobileScrollView.tsx     # Mobile: vertical scroll (from UnifiedGrid)
│
├── themes/
│   ├── styles.ts                # Theme CSS utils (from UnifiedGrid, cleaned up)
│   └── ThemeProvider.tsx         # Context provider (optional, themes also work as props)
│
└── __tests__/                   # Merged + expanded test suite
```

## Key Design Decisions

### 1. Physics Always On (not conditional)
InfiniteGrid only enables physics when the search card is clamped. In the new system, physics runs always:
- Cards settle toward their queue-assigned grid positions via spring forces
- This gives ALL cards smooth, organic movement when the layout changes
- When search card gets stuck, it becomes a static body — other cards physically flow around it
- When cards spawn at edges, they get an entrance burst then settle

### 2. Search Card = Regular Card + Sticky Behavior
- Uses the same `BaseCard` shell as all other cards
- Same animations, same size patterns
- But has `sticky: true` flag — when its grid slot goes off-screen, it clamps to the edge
- When stuck: becomes Matter.js static body, compresses proportionally (UnifiedGrid math)
- When unstuck: becomes dynamic body, expands back, rejoins flow

### 3. Card Pool (renamed from UnifiedGrid's CardQueue)
- "CardPool" better describes what it does — cards in view vs cards waiting
- FIFO queue (fix the wrong FILO naming)
- Spawn/despawn driven by camera movement + viewport bounds
- Filter changes: fade out non-matching, fade in matching, physics settles the rest

### 4. Edge Compression (from UnifiedGrid)
Search card compression states:
- **Free (compression=0)**: Full card, same as any other
- **Top/bottom edge**: Filter pills collapse, becomes compact search bar. Height lerps to 48px
- **Left/right edge**: Collapses to vertical icon strip (64px wide). Back, search, filter icons
- **Transition**: Smooth proportional interpolation based on overshoot distance

Min size increased: `SQUASHED_SIDE_WIDTH: 64 → 80px`, `COLLAPSED_HEIGHT: 48 → 56px`

### 5. Collision Flow-Around
When search card is stuck at an edge:
1. Search card body set to `isStatic: true` at its clamped position
2. `preserveLayoutWithExclusion()` keeps existing card slots when possible and pushes only overlapping cards around the search footprint
3. Physics settling forces pull cards toward new positions
4. Cards smoothly flow around the stuck search card
5. Cards pushed off-screen by this process despawn and re-enter the queue

### 6. Consistent Card Component
All cards share `BaseCard`:
```tsx
<BaseCard size={size} theme={theme} entrance={entranceDelay}>
  {/* ProjectCard / GameCard / SearchCard content */}
</BaseCard>
```
BaseCard handles: border radius, shadow, hover scale, entrance spring animation, exit fade.

## What Gets Deleted
- `src/components/InfiniteGrid/` — entire directory (logic merged into BentoGrid)
- `src/components/UnifiedGrid/` — entire directory (logic merged into BentoGrid)
- Duplicate `SearchCard` components (consolidated into one)
- Duplicate `ProjectCard` components (consolidated into one)
- Dead code: `PERFORMANCE` constants, `ThemeProvider` context (if unused), `GRID.COLUMNS`
- Duplicate `getRandomRotation` function
- Duplicate `useWindowSize` implementations

## What Gets Kept/Reused
- Matter.js physics engine + forces (from InfiniteGrid, enhanced)
- Card pool/queue logic (from UnifiedGrid, renamed + fixed FIFO)
- Edge compression math (from UnifiedGrid, min sizes increased)
- @use-gesture camera (from InfiniteGrid — cleaner than UnifiedGrid's manual pointer tracking)
- Keyboard navigation (from UnifiedGrid)
- Mobile scroll fallback (from UnifiedGrid)
- Theme system (from UnifiedGrid, cleaned up)
- GameCard synthwave styling (from UnifiedGrid)
- All tests (merged, deduplicated)

## Implementation Tasks

### Phase 1: Foundation (scaffold + physics)
1. **Create BentoGrid scaffold with consolidated types and constants** — New directory, merged types/constants, barrel exports. Delete nothing yet.
2. **Port physics engine with always-on settling** — Copy + adapt Matter.js engine, forces, usePhysicsWorld from InfiniteGrid. Make physics always-on with settling toward assigned positions.

### Phase 2: Core systems
3. **Port camera + viewport from InfiniteGrid** — @use-gesture based camera with momentum. Merged coordinate transforms. Viewport bounds with spawn/despawn buffers.
4. **Port card pool + spawn manager from UnifiedGrid** — FIFO queue (fix naming), edge-based spawn/despawn, visibility tracking. Wire to physics — spawned cards get entrance burst, despawned cards get body removed.

### Phase 3: Search card
5. **Build consolidated search card with physics sticky** — BaseCard shell + search UI. Edge detection + compression from UnifiedGrid. When stuck: static physics body + exclusion zone layout. Other cards flow around via Matter.js collision.

### Phase 4: Cards + views
6. **Build BaseCard + port ProjectCard/GameCard** — Shared card shell. Merge ProjectCard from both systems. Port GameCard from UnifiedGrid. Consistent entrance/hover/exit animations.
7. **Build DesktopCanvasView + MobileScrollView** — Desktop: wire all hooks, render canvas. Mobile: vertical scroll fallback. Wire page components (projects, playground) to new BentoGrid.

### Phase 5: Swap + cleanup
8. **Replace old grids with BentoGrid, delete old code** — Update ProjectsGridClient and PlaygroundGridClient to use BentoGrid. Delete InfiniteGrid/ and UnifiedGrid/. Update all imports. Run tests.

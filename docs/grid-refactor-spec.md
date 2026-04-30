# BentoGrid Architecture Spec

Reference: [grid-refactor-requirements.md](grid-refactor-requirements.md) (drift check)

Status: BentoGrid is the active shared grid for `/projects` and `/playground`.
This file documents the current architecture and the remaining polish areas.

## Goal

Keep one shared grid system that supports:

- `/projects` portfolio archive cards with the premium theme.
- `/playground` game and experiment cards with the playful theme.
- Desktop infinite canvas navigation with card recycling and Matter.js settling.
- Mobile filtered scroll fallback.
- A search/filter card that filters the board and stays out of the card queue.

## Current State

| Area | Current behavior |
|------|------------------|
| Physics | Matter.js engine and settling forces are under `physics/` |
| Card pool | FIFO visible/waiting membership is under `core/useCardPool.ts` |
| Spawn/despawn | Edge-based recycling is under `core/useSpawnManager.ts` |
| Camera | Desktop pan/zoom and keyboard panning are under `core/useCamera.ts` |
| Search | `cards/SearchMenuCard.tsx` renders through the shared card shell |
| Layout | Spiral bento placement plus exclusion helpers live under `layout/` |
| Desktop view | `views/DesktopCanvasView.tsx` wires camera, pool, physics, and cards |
| Mobile view | `views/MobileScrollView.tsx` renders filtered cards in document flow |
| Tests | Unit coverage exists for constants, viewport, camera, pool, spawn, physics, exclusion, and card presentation |

## Architecture

```
src/components/BentoGrid/
├── index.ts                    # Public exports
├── BentoGrid.tsx               # Root: mobile detection, delegates to view
├── BentoGrid.types.ts          # Consolidated types
├── BentoGrid.constants.ts      # Consolidated constants
│
├── core/
│   ├── useCamera.ts            # Pan/zoom, keyboard panning, camera state
│   ├── useCardPool.ts          # Card queue: visible + waiting membership
│   ├── useViewport.ts          # Viewport bounds and coordinate transforms
│   ├── useSpawnManager.ts      # Tick loop: despawn off-screen, spawn on edge
│   └── useCardNavigation.ts    # Arrow/Tab keyboard focus
│
├── physics/
│   ├── engine.ts               # Matter.js wrapper
│   ├── forces.ts               # Settling, damping, entrance forces
│   └── usePhysicsWorld.ts      # Bind engine to card pool/layout changes
│
├── layout/
│   ├── positions.ts            # Spiral/radial initial placement
│   ├── exclusion.ts            # Layout with exclusion zone around stuck search card
│   └── cardSizes.ts            # Size pattern logic (1x1, 2x1, etc.)
│
├── cards/
│   ├── SearchMenuCard.tsx       # Search UI + edge-compression presentation
│   ├── ProjectCard.tsx          # Project archive renderer
│   ├── GameCard.tsx             # Playground card renderer
│   ├── BaseCard.tsx             # Shared card shell (border, shadow, hover, entrance anim)
│   └── DefaultCard.tsx          # Fallback
│
├── views/
│   ├── DesktopCanvasView.tsx    # Desktop: canvas + physics + all hooks wired
│   └── MobileScrollView.tsx     # Mobile: filtered vertical scroll fallback
│
└── __tests__/                   # Merged + expanded test suite
```

## Key Design Decisions

### 1. Physics Settling

- Cards settle toward their queue-assigned grid positions via spring forces
- Search can become a static body when stuck
- Spawned cards receive entrance forces and settle toward layout targets

### 2. Search Card = Regular Card + Sticky Behavior
- Uses the same `BaseCard` shell as all other cards
- Same animations, same size patterns
- But has `sticky: true` behavior: when its grid slot goes off-screen, it clamps to the edge
- When stuck: becomes Matter.js static body and compresses proportionally
- When unstuck: becomes dynamic body, expands back, rejoins flow

### 3. Card Pool
- FIFO queue for visible and waiting cards
- Spawn/despawn driven by camera movement + viewport bounds
- Filter changes: fade out non-matching, fade in matching, physics settles the rest

### 4. Edge Compression
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

## Remaining Polish

- Continue tuning dense bento packing around a stuck search card.
- Improve filter changes so cards transition out/in instead of resetting the
  visible pool immediately.
- Keep mobile intentionally simpler unless scroll-based queue recycling becomes
  a product requirement.
- Keep tests behavior-oriented: search-as-card, static/dynamic search body
  transitions, despawn from rendered positions, and shared card-shell behavior.

# BentoGrid System Handoff

## Current Role

BentoGrid is the active shared browsing surface for `/projects` and
`/playground`. Route clients map portfolio and Playground content into the
shared `CardData` model, then pass route-specific renderers through
`renderCard`.

Desktop uses an infinite 2D canvas with drag, wheel/pinch zoom, WASD camera
panning, arrow-key card focus, Matter.js collision, and edge-based card
recycling. Mobile uses the same content and search/filter model in a vertical
scroll fallback without desktop physics.

The two route themes remain distinct:

- `/playground` uses the playful theme for games and experiments.
- `/projects` uses the premium theme for portfolio work.

## Architecture

```
BentoGrid/
  BentoGrid.tsx            # Entry point, picks DesktopCanvasView or MobileScrollView
  BentoGrid.types.ts       # Shared data, layout, camera, search, physics types
  BentoGrid.constants.ts   # Tunable grid, camera, physics, search, theme constants
  index.ts                 # Public exports
  core/                    # Camera, card pool, viewport, spawn, keyboard nav
  physics/                 # Matter.js engine, forces, React bridge
  layout/                  # Bento placement, exclusion/target layout, card sizes
  cards/                   # BaseCard, SearchCard, ProjectCard, GameCard
  views/                   # Desktop and mobile render orchestration
  __tests__/               # Unit tests for math, hooks, physics bridge, rendering
```

Important boundaries:

- Search lives in `cards/` with the rest of the visual card system.
- Card membership is owned by `core/useCardPool.ts`.
- Spawn/despawn decisions are owned by `core/useSpawnManager.ts`.
- Physics bodies and settling are owned by `physics/usePhysicsWorld.ts`.
- Route pages should import `BentoGrid` from `@/components/BentoGrid`, not from
  internal view/core files.

## Current Behavior

- Search now renders once through the shared `BaseCard` shell using a viewport
  projection of its logical canvas slot. Free and sticky states share the same
  render path.
- Search, project, game, and fallback cards share the same `BaseCard` shell
  animation path.
- Sticky search uses a preservation-based exclusion layout: cards keep their
  current slots when possible, and only overlapping cards are pushed around the
  search footprint before Matter.js settling/collision resolves motion.
- Search is always available, filters the other cards, and never enters the
  card queue.
- Despawn checks use rendered/physics-adjusted card rects.
- Spawn density and edge choice still need visual tuning.
- Filtering resets the visible pool immediately instead of animating cards out
  and letting matching cards settle in.
- Mobile renders all filtered cards as a simpler intentional fallback.
- The layout uses spiral placement with bento sizes and exclusion adjustment.

## Public API

Preserve the public API used by pages:

```tsx
<BentoGrid
  theme="playful" | "premium"
  cards={cards}
  onCardSelect={...}
  onBack={...}
  breadcrumb="bentOS / ..."
  renderCard={...}
/>
```

## Open Polish Checklist

Before calling BentoGrid done, verify:

- Search free state is visually indistinguishable from a normal card shell.
- Search is always visible and never queued.
- Search filters other cards, not an internal result list.
- Search top/bottom compression produces a compact horizontal bar.
- Search left/right compression produces a usable vertical strip.
- Search expansion/compression is proportional and smooth.
- Non-search cards never squash.
- Stuck search pushes/blocks cards through physics and layout targets.
- Cards pushed outside viewport despawn and re-enter the queue.
- New cards spawn from the opposite movement edge.
- Project/game/search cards share entrance/exit/focus/hover behavior.
- There is one search card implementation.
- Desktop and mobile behavior differences are intentional and documented.

## Key Files To Inspect First

| File | Why |
|------|-----|
| `src/components/BentoGrid/views/DesktopCanvasView.tsx` | Current orchestration and main rebuild target |
| `src/components/BentoGrid/cards/SearchMenuCard.tsx` | Current search UI source of truth |
| `src/components/BentoGrid/cards/BaseCard.tsx` | Target shared card shell |
| `src/components/BentoGrid/core/useCardPool.ts` | Queue membership and filtering behavior |
| `src/components/BentoGrid/core/useSpawnManager.ts` | Spawn/despawn logic |
| `src/components/BentoGrid/physics/usePhysicsWorld.ts` | React-to-Matter bridge |
| `src/components/BentoGrid/layout/exclusion.ts` | Current workaround for flow-around |
| `src/components/BentoGrid/layout/positions.ts` | Current initial layout algorithm |

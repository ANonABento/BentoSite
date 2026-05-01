# BentoGrid System Handoff

## What We Are Building

BentoGrid is the shared browsing surface for `/projects` and `/playground`.
It should feel like an infinite, tactile bento board: users pan around a 2D canvas,
cards recycle through a queue as they leave the viewport, and a persistent search
card behaves like one of the cards until it reaches an edge.

The target experience is:

- Desktop uses an infinite 2D canvas with drag, wheel/pinch zoom, WASD panning,
  keyboard card focus, Matter.js collision, and edge-based card recycling.
- Mobile uses a single-column vertical scroll fallback with the same card content
  and search/filter model, but no desktop physics.
- `/playground` uses the playful theme: rounded cards, neon/synth styling,
  slight rotation, energetic motion.
- `/projects` uses the premium theme: sharper cards, glass/subtle styling,
  no random rotation, quieter motion.
- Search is always available, filters the other cards, and never enters the
  card queue.

## Non-Negotiable Interaction Model

Search is not a modal, drawer, or separate overlay in the mental model. It is a
sticky grid card:

- When fully on-screen, search uses the same card shell, dimensions, animation
  vocabulary, and physics participation as normal cards.
- When its logical grid slot crosses a viewport edge, the rendered search card
  sticks to that edge and compresses proportionally to the off-screen distance.
- Top/bottom sticky state becomes a compact horizontal search bar.
- Left/right sticky state becomes a vertical sidebar strip with controls/icons.
- Only the search card squashes. Project/game cards never squash.
- When stuck, search acts as a static Matter.js body so other cards collide with
  it and flow around it.
- When the camera moves back and the slot is on-screen again, search expands
  smoothly and rejoins the normal card flow.

## Target Architecture

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

Important boundary: search lives in `cards/` with the rest of the visual card
system. Do not recreate a separate `search/` package unless there is a concrete
reason to split non-visual math out of card rendering.

## Current Implementation Status

The current repo has the broad package shape, page integration, queue, viewport,
camera, card renderers, and Matter.js wrapper in place. The implementation is
not yet faithful to the desired BentoGrid behavior.

Working or mostly working:

- `BentoGrid` is active for `/projects` and `/playground`.
- Old `InfiniteGrid/` and `UnifiedGrid/` packages are gone.
- Desktop pan/zoom and WASD camera movement exist.
- FIFO card pool exists.
- Edge-based spawn/despawn exists.
- Matter.js bodies exist and cards settle toward layout targets.
- Theme split exists for `playful` and `premium`.
- Mobile has a vertical fallback.

Known drift and gaps:

- Search now renders once through the shared `BaseCard` shell using a viewport
  projection of its logical canvas slot. Free and sticky states share the same
  render path.
- Search, project, game, and fallback cards share the same `BaseCard` shell
  animation path.
- Sticky search uses a preservation-based exclusion layout: cards keep their
  current slots when possible, and only overlapping cards are pushed around the
  search footprint before Matter.js settling/collision resolves motion.
- Despawn checks now accept rendered/physics-adjusted card rects, but spawn
  density and edge choice still need visual tuning.
- Filtering resets the visible pool immediately instead of animating cards out
  and letting matching cards settle in.
- Mobile renders all filtered cards; it does not perform queue-based top/bottom
  recycling.
- The layout is spiral placement with bento sizes, not a robust dense bento
  packing system.

## Recommended Rebuild Scope

This should be treated as an internal rebuild of `src/components/BentoGrid`, not
a product rewrite. Preserve the public API used by pages:

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

Reuse:

- Page integration clients for `/projects` and `/playground`
- `CardData` model where possible
- Theme constants, after cleanup
- Camera/viewport helpers, after verifying transform math
- Matter.js engine wrapper, after tightening search-body integration
- Project and game content components, after wrapping with `BaseCard`
- Existing tests as a baseline

Replace or redesign:

- Desktop orchestration so search is part of the same card/layout/physics model
- Search card rendering should continue to use one projection path while the
  Matter body is kept aligned with that projection.
- Layout target generation should continue improving from preservation-based
  displacement toward denser bento packing around search.
- Spawn/despawn so it observes rendered/physics positions, not stale pool slots
- Filter transitions so the board changes by animated queue/layout updates
- Mobile scroll behavior if queue recycling is still required on mobile

## Proposed Implementation Plan

1. Establish a single board model.
   Represent search plus visible content cards in one layout map. Search has a
   stable id (`__search__`) and `sticky: true`; it is never queued.

2. Move search into the card layer.
   Render search through the same card shell path as other cards. The sticky
   presentation can still be computed from the logical slot, but the component
   should not be a separate overlay with separate animation rules.

3. Fix physics/search integration.
   Search should be dynamic while free and static while stuck. Its physics body
   should match the compressed rendered size and clamped position. Other cards
   should receive target positions that avoid search, then collision resolves
   overlap during settling.

4. Fix layout and despawn ownership.
   The card pool should own membership only. A separate layout/physics layer
   should own current positions. Spawn/despawn decisions should use actual
   current card rects.

5. Tighten search physics and layout.
   Keep the single search render path, keep the Matter body aligned with that
   projection during edge compression, and tune displacement so cards pack more
   densely around the sticky search footprint.

6. Improve filter behavior.
   Search filters should update the board with exit/enter transitions and
   physics settling instead of instantly resetting the whole pool.

7. Revisit mobile.
   If mobile queue recycling is still desired, implement scroll-based top/bottom
   recycling. If not, document mobile as intentionally simpler.

8. Update tests around behavior, not implementation details.
   Add tests for search-as-card, static/dynamic search body transitions,
   despawn from current positions, and consistent shell rendering.

## Drift Checklist

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

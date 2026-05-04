# BentoGrid System Handoff

## What We Are Building

BentoGrid is the shared browsing surface for `/projects`, `/playground`, and
(planned) `/photography`. It should feel like an infinite, tactile bento board:
users pan around a 2D canvas, cards recycle through a queue as they leave the
viewport, and a persistent search card behaves like one of the cards until it
reaches an edge.

The target experience is:

- Desktop uses an infinite 2D canvas with drag, wheel/pinch zoom, WASD panning,
  keyboard card focus, Matter.js collision, and card recycling.
- Mobile uses a single-column vertical scroll fallback with the same card content
  and search/filter model, but no desktop physics.
- `/playground` uses the playful theme: rounded cards, neon/synth styling,
  no rotation, energetic motion.
- `/projects` uses the premium theme: sharper cards, glass/subtle styling,
  no random rotation, quieter motion.
- `/photography` (planned) will use a gallery theme: image-forward cards, minimal
  chrome, lightbox on click. See `docs/photography-bentogrid-spec.md`.
- Search is always available, filters the other cards, and never enters the
  card queue.

## Non-Negotiable Interaction Model

### Panning and Card Recycling

The viewport must always feel populated regardless of card count or pan speed:

- When the user pans, cards leaving the viewport recycle to the back of the queue.
- New cards appear inside the viewport to fill any deficit.
- At any pan speed — slow drag, fast flick, momentum coast — the user should
  always see a populated board. Empty viewport states are bugs.
- The spawn system must run at display refresh rate (rAF), not in React effects,
  so spawns never lag behind camera movement.
- Target: 12 cards on-screen at all times when queue has cards available.

### Search Card

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
  core/                    # Camera, board controller, viewport, keyboard nav
    useBoardController.ts  # Unified board state: visible/queue, spawn/despawn, filter
    useCamera.ts           # Pan, zoom, momentum, WASD, gesture bindings
    useViewport.ts         # Viewport bounds, coordinate transforms
    useCardNavigation.ts   # Keyboard card focus/selection
    movement.ts            # Direction detection from camera delta
    cardPoolFilter.ts      # Card search/filter logic
    keyboard.ts            # Editable target detection
  physics/                 # Matter.js engine, forces, React bridge
  layout/                  # Bento placement, exclusion/target layout, card sizes
  cards/                   # BaseCard, SearchCard, ProjectCard, GameCard
  views/                   # Desktop and mobile render orchestration
  __tests__/               # Unit tests
```

## Current Implementation Status (2026-05-02)

### Working

- `BentoGrid` is active for `/projects` and `/playground`.
- Desktop pan/zoom (drag, wheel, pinch, WASD, keyboard).
- `useBoardController` is the unified board state hook (replaced `useCardPool` +
  `useSpawnManager`).
- Deficit-based spawning: counts on-screen cards, spawns to fill target of 12.
- Matter.js physics with settling forces, collision detection.
- `SEARCH_CARD_ID` constant replaces magic `'__search__'` strings.
- `getMovementDirectionFromDelta` deduplicated into `movement.ts`.
- Theme system (`playful`, `premium`) with per-theme card styling.
- Search card uses `theme.searchCard.background` (not `theme.card.background`),
  fixing visibility in light mode.
- Passive event listener fix for pinch gestures.
- Mobile vertical scroll fallback.
- Debug seed system: `?seed=1` or `?debug=queue` for 48/54 card testing.
- 229 tests passing, zero type errors, zero lint errors.

### Known Issues — Spawn/Queue System

**Critical: Viewport empties during fast panning.**

The spawn system runs in a `useEffect` that depends on `camera`. This means:

1. Spawns are always one render frame behind camera movement.
2. During fast panning, the camera moves 20-40px per frame. A card spawned
   at the viewport edge on frame N is behind the viewport by frame N+2.
3. Cumulative result: after ~1500px of continuous panning, on-screen count
   drops to 0-1 despite 14+ cards in the visible set.

**Root cause:** React effects run after render, not synchronously with the
gesture handler. The spawn loop cannot keep up with 60fps camera movement.

**Required fix:** Move the spawn/despawn tick into a `requestAnimationFrame`
loop that reads camera position directly from a ref, bypassing React's render
cycle. The rAF loop should:

- Read `cameraRef.current` (updated synchronously by gesture handler).
- Compute viewport bounds from current camera.
- Despawn cards outside bounds.
- Count on-screen cards.
- Spawn from queue to fill deficit.
- Update a positions ref that the render reads.
- Only trigger a React state update when the visible set actually changes
  (new card added or removed), not on every frame.

This decouples spawn timing from React rendering and ensures the board is
always populated regardless of pan speed.

### Known Issues — Visual/UI

- **Cards render in front of search card.** Search card has `z-50` class but
  is a sibling of the transform layer. Framer Motion stacking contexts on
  card elements can override CSS z-index. Cards overlap the search card.
- **Card rotation on playground theme.** `rotationRange: 3` on playful theme
  causes persistent slight rotation. Consider removing (set to 0).
- **Card click vs drag discrimination.** Fast clicks can be interpreted as
  drags and swallowed by the gesture handler.
- **No card entrance animation.** Spawned cards appear instantly (entrance
  burst was removed). Consider a subtle fade/scale entrance.

### Known Issues — Architecture

- `useCardPool` and `useSpawnManager` still exist in `core/` but are no longer
  used in production. `useBoardController` replaced them. The old hooks remain
  for test compatibility. Consider removing.
- `DesktopCardLayer` wraps cards in `AnimatePresence` which keeps exiting cards
  in the DOM during exit animation. This inflates DOM node count but doesn't
  affect behavior.
- Physics `toBodyCenter`/`toTopLeft` coordinate conversions happen in ~5 places.
  Error-prone when extending to new card types.

## Public API (Preserved)

```tsx
<BentoGrid
  theme="playful" | "premium" | "gallery"
  cards={cards}
  onCardSelect={...}
  onBack={...}
  breadcrumb="bentOS / ..."
  renderCard={...}
/>
```

## Key Files

| File | Purpose |
|------|---------|
| `views/DesktopCanvasView.tsx` | Desktop orchestration, hooks composition |
| `core/useBoardController.ts` | Board state: visible/queue, spawn/despawn, filter |
| `core/useCamera.ts` | Camera pan/zoom/momentum with @use-gesture |
| `core/useViewport.ts` | Viewport bounds, coordinate transforms |
| `core/movement.ts` | Direction detection from camera delta |
| `cards/SearchMenuCard.tsx` | Search card UI |
| `cards/BaseCard.tsx` | Shared card shell |
| `physics/usePhysicsWorld.ts` | React-to-Matter.js bridge |
| `physics/forces.ts` | Settling forces, entrance burst, damping |
| `physics/engine.ts` | Matter.js engine wrapper |
| `layout/positions.ts` | Spiral layout, collision-free placement |
| `layout/cardSizes.ts` | Card size pattern and dimensions |
| `BentoGrid.constants.ts` | All tunable constants |
| `debugSeed.ts` | Test card generation for queue testing |

## Drift Checklist

Before calling BentoGrid done, verify:

### Spawn/Queue
- [ ] Viewport is always populated during panning at any speed.
- [ ] Cards spawn inside the viewport (not at edges or off-screen).
- [ ] Queue drains and refills smoothly as user explores.
- [ ] Spawn system runs at rAF rate, not tied to React render cycle.
- [ ] Works with 9 cards (no queue), 48 cards (seeded), and 100+ cards.

### Search
- [ ] Search free state looks like a normal card using the same shell/motion.
- [ ] Search is always visible and never queued.
- [ ] Search filters other cards, not an internal result list.
- [ ] Search top/bottom compression produces a compact horizontal bar.
- [ ] Search left/right compression produces a usable vertical strip.
- [ ] Search card is always visually above content cards (z-index correct).
- [ ] Content cards never render on top of search card.

### Cards
- [ ] No random rotation on any theme (rotationRange: 0 everywhere).
- [ ] Cards have a subtle entrance animation when spawning.
- [ ] Single click on a card triggers selection (not swallowed by drag).
- [ ] Card hover and focus states are visible and distinct.
- [ ] Cards never overlap each other excessively (physics settling works).

### Themes
- [ ] Premium and playful themes both render correctly.
- [ ] Search card text is visible in both dark and light mode.
- [ ] Gallery theme exists for photography (when implemented).

### General
- [ ] `npm test -- BentoGrid` passes.
- [ ] `npm run type-check` passes.
- [ ] `npm run lint` passes.
- [ ] Visual pass on `/projects` (normal + `?seed=1`).
- [ ] Visual pass on `/playground` (normal + `?seed=1`).
- [ ] Mobile scroll view works on both pages.

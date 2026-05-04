# Search Card — Final Implementation Spec

Status: **Implemented and working**

## Context

The search card in the BentoGrid needs to behave as both a grid-resident card
and a viewport-sticky element. After multiple failed approaches, the current
implementation uses a hybrid canvas/screen rendering model with ghost position
tracking and rehome-on-decompress.

## The Fundamental Problem

The BentoGrid uses a CSS transform on a canvas layer to implement panning.
Cards have fixed canvas positions. The camera transform moves everything.

The search card needs to:
1. Be a real card in the grid (not a floating overlay)
2. Compress when pushed to a viewport edge
3. Decompress immediately when the user pans back (not after traveling back
   to the original position)
4. Fit back into the grid as a full card when decompressed

These requirements conflict because:
- Canvas positions are fixed, but the viewport moves
- A card at canvas (0,0) is at screen center only when camera is at (0,0)
- When the camera moves to (-2000, 0), the card at (0,0) is 2000px off-screen
- To decompress, the card needs to be near the viewport, but its position is far away

## Failed Approaches (Do Not Repeat)

1. **Fixed overlay always** — disconnected from grid, not a real card
2. **Canvas card with sticky override** — position converts to extreme canvas values
3. **Ratcheting compression** — math works but position is still far away
4. **Rehoming to nearest gap** — card jumps to new position, then slides off opposite edge
5. **Viewport center tracking** — card always centered, never compresses
6. **Edge capping position ref** — position never goes off-screen, so compression never triggers
7. **Gap reservation** — proposed reserving grid cells ahead of the decompression
   path and targeting the search card toward the reserved gap. Superseded before
   implementation because the ghost tracking + rehome eviction approach is simpler
   and handles the same problem without a separate reservation system. See
   `search-card-gap-reservation-spec.md` for the original proposal.

## Current Implementation: Hybrid Canvas/Screen with Ghost Tracking

The search card exists in TWO places simultaneously:

### 1. Grid Ghost (canvas layer)

- An invisible placeholder in the grid occupancy map
- Registered under `SEARCH_CARD_ID` (`'__search__'`) in the `GridOccupancy`
- Prevents content cards from spawning at those cells
- Not rendered in the canvas layer — `DesktopCardLayer` skips `SEARCH_CARD_ID`
- The ghost's canvas position drives compression math

### 2. Visual Card (screen layer)

- The actual visible search card
- Rendered as `position: fixed` overlay in `DesktopCanvasView`
- Screen position computed from the ghost's canvas position via `canvasToScreen`
- When the ghost is on-screen: visual card appears at the ghost's screen position
  (looks like it's in the grid)
- When the ghost goes off-screen: visual card clamps to viewport edge and compresses
- Three visual states based on compression and edge:
  - **Side edge** (left/right): `IconStripContent` — vertical icon buttons
  - **Top/bottom edge**: `CompactBarContent` — horizontal search bar
  - **Free** (compression = 0): `FullSearchContent` — full search + category filters

### Ghost Position Tracking (`useSearchCardState`)

The ghost position is maintained in a `useRef` (`ghostPosRef`) and updated
synchronously each render. The logic:

**When ghost is on-screen:**
- Check if the grid home is nearby (distance <= `COMPRESSION_DISTANCE` on each axis)
- If nearby: snap ghost to grid home (post-rehome alignment)
- If far: keep ghost at its previous position (pre-rehome, avoids oscillation bug
  where ghost snaps to far grid home, goes off-screen, snaps back, repeat)

**When ghost is off-screen:**
- Ghost tracks at `viewportEdge - COMPRESSION_DISTANCE` in canvas space
- The ghost only moves deeper off-screen (when user pans further away) but stays
  put when panning back
- This means panning back moves the viewport toward the ghost, reducing
  compression immediately
- Specifically: for left edge, `ghostX = max(prevGhostX, edgePos)` where
  `edgePos = viewportLeftEdge - compressionDistance / zoom`
- Similar logic for right, top, bottom edges

**Compression formula:**
```
offscreenDistance = how far the ghost's screen projection extends past the viewport edge
compression = clamp(offscreenDistance / COMPRESSION_DISTANCE, 0, 1)
```

Constants (from `BentoGrid.constants.ts`):
- `COMPRESSION_DISTANCE`: 180px
- `EDGE_PADDING`: 16px
- `COLLAPSED_HEIGHT`: 64px (top/bottom compressed)
- `SQUASHED_SIDE_WIDTH`: 64px (left/right compressed)

### Rehome on Decompress (`DesktopCanvasView` + `useBoardController`)

When compression transitions from >0 to 0, `DesktopCanvasView` calls
`board.rehomeSearchCard(ghostX, ghostY)`. This:

1. **Releases** the search card's old grid cells via `grid.release(SEARCH_CARD_ID)`
2. **Converts** the ghost position to a grid cell via `pixelToCell(x, y)`
3. **Checks occupancy** at the target cell for the search card's size
4. **Evicts** any content cards occupying those cells:
   - Removes them from `visible`
   - Releases their grid cells
   - Pushes them back to the spawn queue
5. **Places** the search card at the target cell in the occupancy grid
6. **Updates** the search card's position in `visible` to the cell-aligned pixel position

This ensures the search card always wins its position. Evicted content cards
will respawn elsewhere when the viewport moves.

### Sticky Canvas Position Override

When compressed (compression > 0), the search card's display layout is
overridden with the ghost's position and compressed dimensions. This is
computed in `useSearchCardState` as `stickyCanvasPosition` and merged into
`displayLayouts` in `DesktopCanvasView`.

When free (compression = 0), `stickyCanvasPosition` is null and the search
card uses its normal grid position from `board.visible`.

### Content Card Spawn Prevention

There is no separate gap reservation system. The grid occupancy registered
under `SEARCH_CARD_ID` naturally prevents the spawn system in `tick()` from
placing content cards at the search card's cells. The spawn system calls
`grid.findNearest()` which respects occupancy, and `grid.canPlace()` checks
for existing occupants.

### Physics Integration

The search card has a Matter.js physics body managed by `usePhysicsWorld`.
When sticky (compressed), the body is set to static. When free, it's dynamic.
The body position is updated via `updateSearchCard()` each time the display
position changes.

## Rendering Architecture

```
DesktopCanvasView
├── Canvas layer (CSS transform for pan/zoom)
│   └── DesktopCardLayer
│       ├── Content card 1
│       ├── Content card 2
│       └── ... (SEARCH_CARD_ID is SKIPPED here)
│
├── Fixed overlay (position: fixed, z-10)
│   └── Search card visual
│       ├── IconStripContent (side edge compressed)
│       ├── CompactBarContent (top/bottom compressed)
│       └── FullSearchContent (free, uncompressed)
│
└── Reset button (fixed, z-20)
```

## Data Flow

```
board.visible (grid positions)
    │
    ├── searchCardLayout → useSearchCardState
    │       │
    │       ├── ghostPosRef (tracks viewport edge when compressed)
    │       ├── compression (0..1 from ghost screen projection)
    │       ├── screenPosition (clamped screen coords for visual)
    │       ├── stickyCanvasPosition (override when compressed)
    │       └── ghostCanvasPosition (exposed for rehome)
    │
    ├── displayLayouts = board.visible + stickyCanvasPosition override
    │
    └── On compression 0→0 transition:
            board.rehomeSearchCard(ghostX, ghostY)
            → evict occupants → place search card → update visible
```

## Files

| File | Role |
|------|------|
| `cards/useSearchCardState.ts` | Ghost tracking, compression math, screen position |
| `views/DesktopCanvasView.tsx` | Orchestration, rehome trigger, fixed overlay rendering |
| `views/DesktopCardLayer.tsx` | Skips `SEARCH_CARD_ID` (not rendered in canvas) |
| `core/useBoardController.ts` | `rehomeSearchCard()`, grid occupancy, spawn/despawn |
| `BentoGrid.constants.ts` | `SEARCH_CARD` constants, `SEARCH_CARD_ID` |

## Key Constraints

- The visual search card is ALWAYS `position: fixed` (screen space)
- The ghost is in the grid occupancy (canvas space) but not rendered in canvas
- Compression is computed from the ghost's screen projection via `canvasToScreen`
- The ghost follows the viewport edge while compressed (but never moves closer
  to the viewport on its own — only the viewport moves toward the ghost)
- On decompress, the ghost position becomes the new grid home via rehome
- Content cards are evicted at rehome time, not pre-reserved
- The search card never despawns (explicitly skipped in `tick()` despawn loop)
- All existing functionality (icon strip, compact bar, button clicks, category
  filters, grid spawning, queue) continues working

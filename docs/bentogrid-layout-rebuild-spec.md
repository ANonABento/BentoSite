# BentoGrid Layout Rebuild Spec

Status: **Active** — rebuild piece by piece, verify each step.

## Problem

The current BentoGrid layout is broken:
- Cards overlap each other heavily
- No grid alignment — cards are scattered at arbitrary pixel positions
- Cards render on top of the search card (z-index stacking)
- Physics settling is too weak (0.002 strength) to resolve overlaps
- Spiral placement algorithm produces fragile, non-deterministic layouts
- Spawned cards placed at random viewport positions with no overlap check
- The result looks like a pile of cards, not a bento grid

## Approach: Deterministic Grid + Animated Transitions

Remove physics-based layout entirely. Use a **grid occupancy map** for placement
and **Framer Motion** for smooth transitions between grid positions.

Physics stays only for optional future effects (drag, entrance burst) — not for
card positioning.

### Why not fix physics?

Physics-based layout is inherently non-deterministic. Even with stronger settling
and snap-to-grid, you get transient overlaps during settling, edge cases where
bodies deadlock, and a complex debug surface. A grid occupancy map is simpler,
faster, and guarantees correct layout on every frame.

## Grid Model

```
Grid coordinate system:
- Origin at (0, 0) canvas center
- Each cell is CELL_SIZE × CELL_SIZE pixels (180 × 180)
- Gap between cells is GAP pixels (12)
- A card at grid position (col, row) renders at:
    x = col * (CELL_SIZE + GAP)
    y = row * (CELL_SIZE + GAP)
- Card sizes occupy multiple cells:
    1x1 = 1 col × 1 row = 180 × 180 px
    2x1 = 2 cols × 1 row = 372 × 180 px
    1x2 = 1 col × 2 rows = 180 × 372 px
    2x2 = 2 cols × 2 rows = 372 × 372 px
```

### Grid Occupancy Map

```typescript
type GridCell = { col: number; row: number };
type OccupancyMap = Map<string, string>; // "col,row" → cardId

function cellKey(col: number, row: number): string {
  return `${col},${row}`;
}

function occupyCells(map: OccupancyMap, col: number, row: number, size: CardSize, cardId: string): void {
  const { cols, rows } = CARD_SIZES[size];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      map.set(cellKey(col + c, row + r), cardId);
    }
  }
}

function canPlace(map: OccupancyMap, col: number, row: number, size: CardSize): boolean {
  const { cols, rows } = CARD_SIZES[size];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (map.has(cellKey(col + c, row + r))) return false;
    }
  }
  return true;
}
```

### Placement Algorithm: Breadth-First Spiral

For initial layout and for spawning:

```
1. Start from a center cell (0, 0) or the camera's current grid center.
2. BFS outward in a spiral pattern.
3. For each candidate cell, check if the card fits (canPlace).
4. If yes, place it (occupyCells). Move to next card.
5. If no, try next spiral position.
```

This is similar to the current spiral but with proper grid occupancy tracking
instead of rectangle overlap checks.

### Spawn Placement

When spawning cards during panning:

```
1. Compute which grid cells are visible in the viewport.
2. Find unoccupied cells within the viewport.
3. Place the queued card at the nearest available cell to the viewport center.
4. If no cells available in viewport, expand search outward.
```

This ensures spawned cards never overlap and are always grid-aligned.

## Rebuild Steps

### Phase 1: Grid Occupancy System

**Goal:** Replace `positions.ts` spiral with grid-based placement.

Files to change:
- `layout/positions.ts` — rewrite `calculateInitialPositions`
- New: `layout/gridOccupancy.ts` — occupancy map, canPlace, occupyCells, findNearestAvailable

What to build:
1. `GridOccupancyMap` class or module with:
   - `occupy(col, row, size, cardId)`
   - `release(cardId)`
   - `canPlace(col, row, size): boolean`
   - `findNearest(centerCol, centerRow, size): GridCell | null`
2. Rewrite `calculateInitialPositions` to use the occupancy map
3. Reserve center cells for search card (SEARCH_CARD_ID)

Verify:
- Initial layout has zero overlaps
- Cards are grid-aligned (positions are multiples of CELL_SIZE + GAP)
- Search card area is respected
- `npm test`, `npm run type-check`, `npm run lint`
- Visual check on `/projects` and `/projects?seed=1`

### Phase 2: Grid-Based Spawning

**Goal:** Spawned cards land on grid cells, not random positions.

Files to change:
- `core/useBoardController.ts` — replace `getSpawnPositionInViewport` with grid-based placement

What to build:
1. Board controller maintains an `OccupancyMap` ref
2. When spawning, find nearest available grid cell within viewport bounds
3. When despawning, release cells from occupancy map
4. `tick()` uses occupancy map for all placement decisions

Verify:
- Pan right 1500px with `?seed=1` — all spawned cards are grid-aligned
- No overlaps between spawned and existing cards
- Viewport always has ~12 cards visible

### Phase 3: Remove Physics from Layout

**Goal:** Cards positioned by grid math, not physics bodies.

Files to change:
- `views/DesktopCanvasView.tsx` — remove `usePhysicsWorld` dependency for positioning
- `views/DesktopCardLayer.tsx` — render from grid positions, not physics positions
- `physics/` — keep the module but don't use it for card positioning

What to build:
1. `DesktopCardLayer` renders cards directly from `board.visible` positions
2. No physics position merging
3. Card transitions handled by Framer Motion `animate` (already works — cards
   spring to new x/y when position changes)

Verify:
- Cards appear at grid positions immediately
- No jitter, bouncing, or settling drift
- Smooth animation when cards enter/exit viewport

### Phase 4: Z-Index Fix

**Goal:** Search card always renders above content cards.

Files to change:
- `views/DesktopCanvasView.tsx` — ensure search card DOM order is after card layer
- `cards/SearchMenuCard.tsx` — verify z-index

What to build:
1. Search card rendered AFTER the card layer in DOM order
2. Explicit `z-index: 50` on search card container
3. Card layer limited to `z-index: 0-10` range

Verify:
- No content card ever renders on top of search card
- Search card is always interactive (not blocked by invisible card elements)

### Phase 5: Visual Polish

**Goal:** Clean, professional bento appearance.

Files to change:
- `BentoGrid.constants.ts` — set `rotationRange: 0` on all themes
- `cards/BaseCard.tsx` — entrance animation (opacity fade only, no spring from origin)
- Various card components — ensure consistent styling

What to build:
1. Remove rotation from all themes
2. Entrance animation: fade in at correct position (opacity 0→1, scale 0.95→1)
3. Exit animation: fade out (opacity 1→0)
4. Consistent card shadows and borders

Verify:
- All cards are straight (no rotation)
- Entrance/exit looks smooth
- Overall grid looks clean and professional

### Phase 6: Cleanup

**Goal:** Remove dead code and update tests.

Files to remove:
- `core/useCardPool.ts` (replaced by useBoardController)
- `core/useSpawnManager.ts` (replaced by useBoardController)
- `layout/exclusion.ts` (replaced by grid occupancy)
- Physics settling forces (no longer used for layout)

Files to update:
- `core/index.ts` — remove dead exports
- `__tests__/` — update tests for new grid placement
- `docs/bentogrid-handoff.md` — update current state

## Constants Reference

Keep these, they define the grid:
```
CELL_SIZE = 180    // px per grid cell
GAP = 12           // px between cells
INITIAL_SPAWN_COUNT = 12  // target cards on screen
MAX_VISIBLE = 30   // max cards in visible set
DESPAWN_BUFFER = 200  // px outside viewport before despawn
```

## Non-Goals

- No changes to the public BentoGrid API
- No changes to mobile scroll view
- No changes to card content (ProjectCard, GameCard)
- No changes to search card UI or behavior (just z-index fix)
- No changes to camera/pan/zoom system (working fine)
- No CMS or dynamic data changes

## Success Criteria

Looking at `/projects?seed=1`:
- Cards form a clean grid with consistent gaps
- No overlaps between any cards
- Search card is always on top
- Panning in any direction spawns grid-aligned cards
- No empty viewport regardless of pan speed
- Cards are straight (no rotation)
- Entrance/exit animations are smooth
- Filter/search works without layout jumps

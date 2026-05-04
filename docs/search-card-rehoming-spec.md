# Search Card Re-homing Spec

Status: **Implementing**

## Problem

When the search card compresses to a viewport edge and the user pans back,
the search card tries to return to its original grid home (e.g., near canvas
origin). If the user panned 2000px away, the search card won't fully
decompress until they pan all 2000px back.

## Solution: Re-home to nearest viewport gap

When the user pans back and the search card starts decompressing, it should
find the nearest available grid cell **in the current viewport** and target
that as its new home. Decompression distance is then based on the distance
from the viewport edge to that nearby cell — always short.

### Flow

1. User pans right → search card hits left edge → compresses → sticks
2. User pans back (left) → ratcheting compression starts decreasing
3. Board controller finds the nearest available grid cell in/near the viewport
4. Search card's grid position is updated to that cell
5. Compression is now relative to the new nearby home → decompresses quickly
6. Search card fully decompresses into the new grid cell

### Implementation

**`useBoardController.ts`** — add `rehomeSearchCard(camera, windowSize)`:
- Computes viewport center in grid coordinates
- Finds nearest available cell via `grid.findNearest(centerCol, centerRow, '2x1')`
- Releases old search card cells, places at new cell
- Updates `visible` map with new position

**`DesktopCanvasView.tsx`** — call `rehomeSearchCard` when compression drops
below a threshold (e.g., 0.5) after being fully compressed:
- Track previous compression in a ref
- When compression transitions from high→low, trigger rehome
- The search card's `searchCardLayout` in `board.visible` updates
- `useSearchCardState` recomputes from the new (nearby) position
- Decompression completes quickly since the new home is close

### Key constraint

Only rehome when the search card is decompressing (panning back toward it).
Don't rehome while compressing or while fully free. The trigger is:
`wasCompressed && compression < threshold`.

## Files to change

| File | Change |
|------|--------|
| `core/useBoardController.ts` | Add `rehomeSearchCard` method |
| `views/DesktopCanvasView.tsx` | Call rehome on decompression transition |
| `docs/bentogrid-handoff.md` | Update search card behavior section |

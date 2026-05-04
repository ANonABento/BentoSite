# Search Card Gap Reservation — Next Task Spec

Status: **Ready to implement**

## Problem

The search card decompresses when panning back, but has nowhere to slot into
the grid because content cards already occupy all nearby cells. The card
decompresses into empty space and floats as an overlay instead of fitting
cleanly into the bento grid.

## Solution: Reserve a gap in the grid for the search card to slot into

When the search card is compressed at an edge and the user starts panning
back, the system should:

1. **Find the nearest 2×1 gap** in the grid near the viewport edge where the
   search card is stuck
2. **Block that gap** from card spawning (don't place content cards there)
3. **Target the search card** toward that gap — compression is based on
   distance from the edge to the gap
4. **Slot in** — when the search card reaches the gap, compression = 0,
   the card is back in the grid as a normal card

## Detailed Flow

### Phase 1: Compressed at edge
- Search card is at left edge, fully compressed (icon strip)
- Content cards fill the viewport
- User starts panning back (leftward)

### Phase 2: Gap reservation triggered
- Trigger: user pans back while search card is compressed
- Find the nearest available 2×1 cell in the grid, starting from the
  viewport edge the search card is on
- Reserve those cells in the grid occupancy (place SEARCH_CARD_ID there)
- This prevents the spawn system from filling those cells
- If no cells available, evict the content card closest to the edge
  (despawn it back to queue, freeing its cells)

### Phase 3: Decompression animation
- The search card's target position is the reserved gap (in canvas space)
- Compression = distance(searchCardEdgePosition, gapPosition) / COMPRESSION_DISTANCE
- As the user pans back, the search card slides from the edge toward the gap
- The card smoothly decompresses (icon strip → full card) as it approaches
- Width/height interpolate from compressed to full over this distance

### Phase 4: Slotted in
- Search card reaches the gap, compression = 0
- Card is now a full 2×1 card at the reserved grid cells
- This becomes its new grid home
- Normal grid card behavior resumes

## Implementation

### Changes to `useBoardController.ts`

Add `reserveSearchGap(nearX: number, nearY: number)`:
- Finds nearest available 2×1 cells near the given canvas position
- If none available within 2 cells of the edge, despawn the nearest
  content card to free space
- Reserves the cells as SEARCH_CARD_ID
- Returns the canvas position of the reserved gap
- Updates `board.visible` with the new search card position

### Changes to `useSearchCardState.ts`

When decompressing (ghost moving toward viewport):
- Get the reserved gap position from the board
- Compute compression as distance from current edge position to gap position
- Interpolate width/height/position between compressed and gap position
- When compression reaches 0, the card is at the gap

### Changes to `DesktopCanvasView.tsx`

- Detect when decompression starts (compression drops below threshold
  after being high)
- Call `board.reserveSearchGap()` to create the gap
- Pass the gap position to `useSearchCardState` for targeting

### New prop on useSearchCardState

```typescript
interface UseSearchCardStateOptions {
  // ... existing props
  /** Target gap position for decompression (canvas coords) */
  decompressionTarget?: { x: number; y: number } | null;
}
```

When `decompressionTarget` is set, compression is computed relative to
the target instead of relative to the grid home.

## Key Design Decisions

1. **Gap reservation happens once** when decompression starts, not every
   frame. The gap stays reserved until the card slots in.

2. **If the user reverses direction** (pans away again) before slotting in,
   the gap is released and the card re-compresses.

3. **Gap position is near the edge**, not at viewport center. This makes
   the decompression distance short and the slot-in feel natural.

4. **Evicting content cards** to make space is acceptable — the evicted
   card goes back to the queue and will respawn elsewhere.

## Files to Change

| File | Change |
|------|--------|
| `core/useBoardController.ts` | Add `reserveSearchGap()` method |
| `cards/useSearchCardState.ts` | Accept decompressionTarget, compute targeted compression |
| `views/DesktopCanvasView.tsx` | Detect decompression, trigger gap reservation |

## Testing

- Pan right 2000px → search card at left edge
- Pan back → gap appears near left edge, search card slides toward it
- Continue panning back 200-300px → search card slots into grid
- Pan away again → search card compresses, gap releases
- Verify with `?seed=1` (many cards) and without (9 cards)

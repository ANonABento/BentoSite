# Search Card Gap Reservation — SUPERSEDED

Status: **Superseded** — this approach was not implemented. See `search-card-final-spec.md` for the actual working implementation.

## What this was

This spec proposed reserving a gap in the grid ahead of the search card's
decompression path, so it would have a clear slot to land in. The idea was:

1. Detect when the user starts panning back while the search card is compressed
2. Find the nearest available 2x1 gap near the viewport edge
3. Block that gap from card spawning
4. Slide the search card toward the gap as compression decreases

## Why it was superseded

The gap reservation approach was replaced by a simpler design:

- **Grid occupancy under `SEARCH_CARD_ID` already prevents spawning** at the
  search card's cells. No separate reservation system is needed.
- **Eviction happens at rehome time**, not pre-reserved. When the search card
  decompresses and `rehomeSearchCard` fires, it places the card at the ghost's
  current cell and evicts any content cards occupying those cells at that moment.
- **Ghost position tracking** handles decompression naturally. The ghost tracks
  near the viewport edge while compressed (`viewportEdge - COMPRESSION_DISTANCE`),
  so decompression is always immediate when panning back — no gap targeting needed.

The actual implementation is documented in `search-card-final-spec.md`.

---

## Original Spec (preserved for historical reference)

### Problem

The search card decompresses when panning back, but has nowhere to slot into
the grid because content cards already occupy all nearby cells. The card
decompresses into empty space and floats as an overlay instead of fitting
cleanly into the bento grid.

### Proposed Solution

When the search card is compressed at an edge and the user starts panning
back, the system should:

1. **Find the nearest 2x1 gap** in the grid near the viewport edge where the
   search card is stuck
2. **Block that gap** from card spawning (don't place content cards there)
3. **Target the search card** toward that gap — compression is based on
   distance from the edge to the gap
4. **Slot in** — when the search card reaches the gap, compression = 0,
   the card is back in the grid as a normal card

### Proposed Changes

| File | Change |
|------|--------|
| `core/useBoardController.ts` | Add `reserveSearchGap()` method |
| `cards/useSearchCardState.ts` | Accept decompressionTarget, compute targeted compression |
| `views/DesktopCanvasView.tsx` | Detect decompression, trigger gap reservation |

This approach was never implemented. The ghost tracking + rehome eviction
approach proved simpler and more robust.

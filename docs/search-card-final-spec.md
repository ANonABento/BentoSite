# Search Card — Final Implementation Spec

Status: **Needs fresh implementation**

## Context

We've tried multiple approaches for the info card positioning and all have
had issues. This spec defines the definitive approach.

## The Fundamental Problem

The BentoGrid uses a CSS transform on a canvas layer to implement panning.
Cards have fixed canvas positions. The camera transform moves everything.

The info card needs to:
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

## The Solution: Hybrid Canvas/Screen Rendering

The info card exists in TWO places simultaneously:

### 1. Grid Ghost (canvas layer)
- An invisible placeholder in the grid occupancy map
- Reserves cells so content cards don't overlap
- Moves with the canvas like any other card
- Not rendered visually

### 2. Visual Card (screen layer)
- The actual visible info card
- Positioned in SCREEN coordinates (position: fixed)
- Screen position computed from the ghost's canvas position via canvasToScreen
- When the ghost is on-screen: visual card appears at the ghost's screen position
  (looks like it's in the grid)
- When the ghost goes off-screen: visual card clamps to viewport edge and compresses
- The ghost's canvas position is what drives compression distance

### Why this works for decompression

When the user pans back, the ghost's screen position moves back toward the
viewport. Compression is based on `distance(ghostScreenPos, viewportEdge)`.
This distance decreases as the user pans back. Decompression starts immediately.

BUT: the ghost can be 2000px off-screen. So decompression would still take 2000px.

### The missing piece: Ghost repositioning

When the ghost is off-screen AND the user starts panning back, the ghost's
canvas position should be updated to be just outside the viewport edge.
This way the decompression distance is always small (< COMPRESSION_DISTANCE).

This is the `rehomeInfoCard` approach, but done correctly:
- Don't rehome to the viewport center (causes the slide-off-opposite-edge bug)
- Rehome to just OUTSIDE the edge the card is stuck on
- This puts the ghost at `viewportEdge - COMPRESSION_DISTANCE` in canvas space
- Decompression then takes exactly COMPRESSION_DISTANCE pixels of panning

### When to rehome

Rehome the ghost every frame while the card is compressed. The ghost position
should track `viewportEdge - COMPRESSION_DISTANCE` on the stuck axis. This
means the ghost "follows" the viewport at a fixed offset from the edge.

On the non-stuck axis, the ghost position should stay at its original value
(or clamp to viewport bounds).

### When the card decompresses

When compression reaches 0 (ghost is back on-screen), the ghost stops
following the viewport and stays at its current canvas position. This
becomes the card's new grid home. Content cards adjust around it.

## Implementation Plan

### Step 1: Implement ghost tracking in useInfoCardState

The hook needs a ref that tracks the info card's "effective canvas position"
(the ghost). Each frame:

```
if (ghost is on-screen) {
  // Free state — ghost stays put at its grid position
  effectivePos = gridHome
} else {
  // Compressed state — ghost tracks viewport edge
  if (stuck on left edge) {
    effectivePos.x = viewportLeft - COMPRESSION_DISTANCE + edgePadding
  }
  if (stuck on right edge) {
    effectivePos.x = viewportRight + COMPRESSION_DISTANCE - cardWidth - edgePadding
  }
  // Similar for top/bottom
  // Non-stuck axis: clamp to viewport
}

// Compute presentation from effectivePos (via getInfoCardPresentation)
// This gives correct compression (0 to 1 over COMPRESSION_DISTANCE)
```

### Step 2: Visual card as fixed overlay

The info card renders as `position: fixed` (current approach). Its screen
position comes from `effectivePresentation.screenPosition`. This already works.

### Step 3: Update grid home on decompress

When compression transitions from >0 to 0, update the info card's position
in `board.visible` to the ghost's current canvas position. This re-anchors
the grid home to wherever the card is now. Use `board.rehomeInfoCard` or
equivalent.

### Step 4: Grid occupancy follows ghost

The grid occupancy for the info card should track the ghost position, not
the original grid home. This ensures content cards don't spawn where the
info card currently is.

## Files to Change

| File | Change |
|------|--------|
| `cards/useInfoCardState.ts` | Ghost tracking logic, replace edge-capping |
| `views/DesktopCanvasView.tsx` | Grid home update on decompress |
| `core/useBoardController.ts` | Re-add rehomeInfoCard or equivalent |

## Key Constraints

- The visual info card is ALWAYS `position: fixed` (screen space)
- The ghost is in the canvas layer (canvas space) but invisible
- Compression is computed from the ghost's screen projection
- The ghost follows the viewport edge while compressed
- On decompress, the ghost becomes the new grid home
- Content cards never overlap the ghost's grid cells
- All existing functionality (icon strip, compact bar, button clicks,
  grid spawning, queue) must continue working

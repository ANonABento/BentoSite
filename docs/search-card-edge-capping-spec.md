# Search Card Edge Capping Spec

Status: **Implementing**

## The Problem (precisely defined)

The search card has a canvas position (its grid home). When the user pans, the
card's screen projection moves toward a viewport edge, compresses, and sticks.
The canvas position stays fixed at the original grid home. If the user pans
2000px, the grid home is 2000px off-screen. Panning back requires 2000px to
reach the grid home and start decompressing.

## The Fix

**Cap the search card's canvas position so it never goes further than the
viewport edge.** As the user pans, the search card's position in `board.visible`
is continuously updated to stay at the viewport edge (in canvas space). It
can never go further off-screen than the edge.

This means:
- When free (on-screen): position = grid home (normal)
- When at edge: position = viewport edge in canvas coords (capped)
- When user keeps panning past edge: position stays at edge (doesn't go further)
- When user pans back: position is at the edge, so decompression starts immediately

## How it works

In `getSearchCardPresentation` (or in `useSearchCardState`), after computing
the screen projection of the canvas position:

1. If the card's screen position would go past a viewport edge, compute the
   canvas position that corresponds to the edge
2. Update the search card's position to that edge-capped canvas position
3. The `offscreenDistance` is always small (0 to COMPRESSION_DISTANCE at most)
4. Compression ramps up over COMPRESSION_DISTANCE as the card crosses the edge
5. When the user pans back, the card is RIGHT at the edge, so compression
   immediately starts dropping

## What to change

**Only `useSearchCardState.ts`** — specifically the `stickyCanvasPosition`
computation.

Currently: `stickyCanvasPosition` clamps the ORIGINAL canvas position to
the viewport bounds. But the original position can be far away, so the
clamped position is always at the edge (maxed out).

Fix: Instead of clamping the original position, compute the edge-capped
position and feed it BACK as the search card's position for the NEXT frame.
Use a ref to track the "effective" canvas position that stays at the edge.

### The key insight

The search card's canvas position should be a **ref that tracks** rather
than a fixed grid home. Each frame:

```
effectiveCanvasPos = clamp(effectiveCanvasPos, viewportLeft, viewportRight)
```

When the viewport moves right (user pans right), `viewportLeft` increases.
If `effectiveCanvasPos` is already at `viewportLeft`, it moves with it —
staying at the edge. When the user pans back, `viewportLeft` decreases,
but `effectiveCanvasPos` stays put (it was clamped from below, now it's
above the minimum). The card starts coming back on-screen.

## Compression changes

Also fix the compression threshold for icon state. Currently switches to
icon strip at compression > 0.3. Should be closer to 0.8 so the card
shrinks smoothly as a card first, then switches to icons only when very
compressed. This removes the "gap" the user sees during compression.

## Remove

- Remove the ratcheting system (maxDist, effectiveDist refs) — no longer needed
- Remove `rehomeSearchCard` from board controller — no longer needed
- Remove `wasCompressedRef` from DesktopCanvasView — no longer needed
- Remove `resetRatchet` from useSearchCardState — no longer needed

The edge-capped position ref replaces ALL of these mechanisms.

## Files to change

| File | Change |
|------|--------|
| `cards/useSearchCardState.ts` | Add position tracking ref, remove ratcheting |
| `views/DesktopCanvasView.tsx` | Remove rehome logic, pass camera to position tracking |
| `core/useBoardController.ts` | Remove `rehomeSearchCard` |
| `cards/SearchMenuCard.tsx` | Adjust compression thresholds for icon/bar switch |

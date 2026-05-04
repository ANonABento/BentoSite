# Search Card Position Fix — Handoff Spec

Status: **Needs implementation** — previous attempts have failed, fresh approach needed.

## The Problem

The search card's position tracking is broken. When the user pans away from the
search card and then pans back, they have to pan the EXACT same distance back
before the search card decompresses. This makes the sticky behavior feel broken.

### Root Cause

The search card has a fixed "home" position in canvas space (its grid cell near
origin). Compression is calculated based on how far this home position is from
the viewport edge in screen space. When you've panned 2000px, the home is 2000px
off-screen. The compression formula `distance / COMPRESSION_DISTANCE` stays at
max (1.0) until you pan back within 180px of the original position.

### What Should Happen

1. User pans right → search card hits left edge → compresses to icon strip
2. User continues panning right → search card stays as icon strip at left edge
3. User pans back LEFT a small amount (50-100px) → search card immediately
   starts decompressing
4. User pans back a bit more → search card fully decompresses to full card

The key: decompression should be relative to the EDGE, not relative to the
original position.

## Failed Approaches (Don't Repeat)

### 1. updateSearchPosition — updating board.visible with sticky position
Broke the entire grid. Cards stopped rendering correctly because the board's
visible map was being mutated from the render path, causing cascading re-renders
and stale state.

### 2. Increasing COMPRESSION_DISTANCE to 600px
Didn't solve the core issue. The distance from original position to viewport
edge is always >> COMPRESSION_DISTANCE once you've panned more than a screenful.
Capping doesn't help because the raw distance grows unboundedly.

### 3. Making search card track viewport center
Made the search card always centered — it never compresses because it's always
at the viewport center. Defeats the purpose of it being a grid card that can
be panned past.

### 4. Converting screen clamp back to canvas coordinates
Produced extreme canvas values (x=2000+) that made the search card's "position"
meaningless for spawning and grid calculations.

## Correct Solution

The search card needs TWO position concepts:

1. **Grid home** — its cell in the grid occupancy map, used for initial layout
   and for determining where content cards can/can't go. This stays fixed.

2. **Render position** — where it actually draws on screen. This is:
   - When free: grid home (moves with canvas transform like any card)
   - When sticky: clamped to the viewport edge in SCREEN coordinates

The compression calculation should be based on the **render position relative to
the viewport**, not the grid home relative to the viewport.

### Implementation Approach

The cleanest way to do this:

**The search card should render as `position: fixed` ALWAYS** (not in the canvas
layer). Its screen position is computed each frame:

1. Compute where the grid home would appear on screen (via canvasToScreen)
2. If fully on-screen → render at that screen position (looks like it's in the grid)
3. If partially off-screen → clamp to edge, apply compression
4. Compression is based on `min(distancePastEdge, COMPRESSION_DISTANCE)`

This is actually what the ORIGINAL code did before Phase A. The problem with the
original was that it was disconnected from the grid — cards could render behind
it. That was fixed by the grid occupancy exclusion zone.

So the fix is:
- **Revert the search card to `position: fixed` overlay** (like pre-Phase A)
- **Keep it in the grid occupancy map** (so content cards don't overlap its area)
- **Keep the physics collision body** (so content cards flow around it when sticky)
- **Keep the icon strip / compact bar UI** (Phase B improvements)
- **The grid home stays fixed** — compression is only measured over
  COMPRESSION_DISTANCE pixels of overshoot, not cumulative distance

The key insight that was missing: the search card being `position: fixed` doesn't
mean it's "disconnected" from the grid. It means it renders in screen space while
its LOGICAL position (for grid/physics) is in canvas space. These are two
different things and they should be separate.

### What to change

1. `DesktopCanvasView.tsx`: Render SearchMenuCard as a sibling of the canvas
   layer (not inside it), with `position: fixed`. Pass screen-space position
   from useSearchCardState.

2. `DesktopCardLayer.tsx`: Skip rendering the search card (it's rendered
   separately). When encountering SEARCH_CARD_ID in layouts, return null.

3. `useSearchCardState.ts`: Revert to computing position from canvasToScreen
   of the grid home. This is the original approach — compression based on
   how far the card's screen projection goes past the viewport edge.

4. `SearchMenuCard.tsx`: Change back to `positionMode="fixed"`.

5. Keep: grid occupancy reservation, physics body updates, icon strip UI,
   compact bar UI, button stopPropagation.

### Why this works for the decompression problem

With `position: fixed` and screen-space positioning:
- The search card renders at the clamped screen position (e.g., left edge)
- Its screen position is always near the viewport edge (16-80px from edge)
- Compression is based on `max(0, padding - cardLeft)` where `cardLeft` is
  the screen X of the card
- When you pan back, the card's screen projection moves back toward center
- BUT the card is `position: fixed` so it stays at the edge until
  compression drops to 0
- The compression drops from 1→0 over COMPRESSION_DISTANCE (180px) as the
  card's grid home comes back on-screen

Wait — this is STILL the same problem. The grid home is at canvas (0,0).
When you've panned 2000px right, `canvasToScreen(0, 0)` gives screen
x = -2000. `padding - (-2000) = 2016`. Compression stays at 1.

### Actually Correct Solution

The compression should NOT be based on the grid home's screen position.
It should be based on **the velocity / recent movement of the camera**.

OR: track the search card's position as a **spring** that follows the
viewport center with lag. When the camera moves, the search card's tracked
position follows, but with a delay. When the tracked position hits a
viewport edge, it sticks. When the camera reverses, the spring immediately
pulls the tracked position back toward center.

This is the "follow camera with clamping" approach:

```
// Each frame:
searchTarget = viewportCenter  // where the search card wants to be
searchPosition = lerp(searchPosition, searchTarget, 0.1)  // spring follow
searchPosition = clampToViewportEdges(searchPosition)  // stick to edges

// Compression = based on how much clamping was applied
clampAmount = distance(searchPosition, unclamped lerp position)
compression = clamp(clampAmount / COMPRESSION_DISTANCE, 0, 1)
```

This gives:
- Pan right → search card lags behind → hits left edge → sticks → compresses
- Keep panning → search card stays at left edge, fully compressed
- Pan back → search card's spring target moves back → immediately pulls away
  from edge → starts decompressing
- Keep panning back → search card fully decompresses and centers

The spring follow gives the card momentum-like behavior. It doesn't snap
instantly to center (which was the Problem #3 above). It follows with a
delay, which makes it feel physical and intentional.

## Files to modify

| File | Change |
|------|--------|
| `views/DesktopCanvasView.tsx` | Render search card as fixed overlay again, pass tracked position |
| `views/DesktopCardLayer.tsx` | Skip SEARCH_CARD_ID, don't render in canvas layer |
| `cards/useSearchCardState.ts` | Implement spring-follow position tracking with edge clamping |
| `cards/SearchMenuCard.tsx` | positionMode="fixed", keep icon strip/compact bar |

## Key constraint

Do NOT modify `useBoardController`, `gridOccupancy`, `positions.ts`, or
any of the content card rendering. Those are working correctly. The fix is
ONLY about how the search card's render position is computed and where it
renders in the DOM.

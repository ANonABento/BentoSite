# Search Card as Grid Card — Rebuild Spec

Status: **Planned**

## Problem

The search card is currently a `position: fixed` overlay that floats above the
grid. It doesn't participate in the grid layout or physics. This causes:

1. **Search card moves differently than other cards** — it stays at screen center
   while other cards move with the camera. Feels disconnected.
2. **Cards behind the search card** — grid doesn't know where the search card
   renders, so it places content cards under it.
3. **No collision flow-around** — when the search card sticks to an edge, other
   cards don't react. They just sit behind it.
4. **Artificial exclusion zone** — we hack around the problem by reserving a
   static 4×3 grid zone. This wastes space and doesn't adapt.

## Target Behavior (from original spec)

> "Search is a regular card that participates in the same physics/layout as
> other cards."

### Free State (search card fully on-screen)

- Occupies a 2×1 grid slot like any other card
- Rendered inside the canvas transform layer (same coordinate space)
- Moves with the camera just like content cards
- Has the same BaseCard shell, animations, and visual weight
- Physics body is **dynamic** — other cards can push it, it can push them
- Never despawns, never enters the queue

### Sticky State (search card at viewport edge)

Triggers when the search card's grid slot would move off-screen:

1. Search card **clamps** to the viewport edge (stops scrolling off)
2. Search card **compresses** proportionally (existing math in `getSearchCardPresentation`)
3. Search card becomes a **static** Matter.js body at its clamped position
4. Other cards **collide** with the static body and flow around it
5. Cards pushed off-screen by the search card despawn normally

### Transition back to Free

When the camera moves back and the search card's grid slot is fully on-screen:

1. Search card **releases** from the edge
2. Search card becomes **dynamic** again
3. Search card **expands** back to full size
4. Search card **settles** to its grid position via physics

## Architecture Changes

### What changes

| Component | Current | Target |
|-----------|---------|--------|
| SearchMenuCard render | `position: fixed`, separate from card layer | Inside canvas transform layer, same as content cards |
| SearchMenuCard position | Screen coordinates (from useSearchCardState) | Canvas coordinates (grid cell) when free, clamped canvas coords when sticky |
| Grid placement | Static 4×3 exclusion zone | Search card placed in grid like any card, 1 cell buffer |
| Physics body | None (search card has no body) | Dynamic body when free, static body when sticky |
| DesktopCanvasView | Renders search card as sibling overlay | Renders search card inside DesktopCardLayer |
| DesktopCardLayer | Only renders content cards | Renders all cards including search |
| useBoardController | Search card excluded from visible map | Search card IN visible map, excluded from queue |

### What stays the same

- SearchMenuCard UI (search input, categories, breadcrumb, back button)
- Edge compression math (lerp between full size and compact)
- Search card filtering behavior
- BaseCard shell component
- Mobile scroll view (search card stays simple on mobile)
- Camera, pan, zoom systems
- Grid occupancy and BFS placement
- Physics engine, settling, snap-to-grid

## Implementation Phases

### Phase A: Move search card into the canvas layer

**Goal:** Search card renders in the same coordinate space as content cards.

Files to change:
- `views/DesktopCanvasView.tsx`
- `views/DesktopCardLayer.tsx`
- `cards/SearchMenuCard.tsx`
- `core/useBoardController.ts`
- `layout/positions.ts`

Steps:
1. Add search card to `board.visible` map with a fixed grid position (e.g., cell (-1, 0), size 2×1)
2. Remove search card from the overlay position in DesktopCanvasView
3. Render search card inside DesktopCardLayer alongside content cards
4. Change SearchMenuCard `positionMode` from `"fixed"` to `"absolute"`
5. Pass canvas-space position instead of screen-space position
6. Remove the static 4×3 exclusion zone from `reserveSearchCard` — the search card occupies its own cells naturally via the grid occupancy
7. Add 1-cell buffer around search card in grid placement (place() the search card as 2×1, but findNearest should skip cells adjacent to it — or just let physics handle separation)

Verify:
- Search card moves with the camera when panning
- Search card is in the grid alongside other cards
- No content cards overlap the search card
- Grid is clean with consistent gaps

### Phase B: Add sticky edge behavior

**Goal:** Search card sticks to viewport edge when its grid slot scrolls off.

Files to change:
- `cards/SearchMenuCard.tsx` or new `useSearchCardSticky.ts` hook
- `views/DesktopCanvasView.tsx`
- `physics/usePhysicsWorld.ts`

Steps:
1. Each frame (rAF loop), compute search card's screen position from its canvas position + camera
2. If screen position would be off-screen, clamp to viewport edge
3. Override the search card's rendered position with the clamped position
4. The clamped position is in **canvas** coordinates (convert screen clamp back to canvas)
5. Apply compression proportional to how far off-screen the slot is (existing math)
6. When clamped, set search card's physics body to `isStatic: true`
7. When unclamped, set back to `isStatic: false`

Key insight: the search card still lives in the canvas layer. Its position is
just overridden when it would go off-screen. The override converts screen-edge
clamp back to canvas coordinates so it stays in the same coordinate system.

Verify:
- Pan right → search card sticks to left edge, compresses
- Pan back → search card releases, expands, returns to grid slot
- Top/bottom edge compression works
- Left/right edge compression works
- Transition is smooth and proportional

### Phase C: Physics collision with sticky search

**Goal:** Content cards flow around the sticky search card.

Files to change:
- `physics/usePhysicsWorld.ts`
- `physics/forces.ts`
- `core/useBoardController.ts`

Steps:
1. Search card has a physics body at all times
2. When free: body is dynamic, settles toward grid target (same as other cards)
3. When sticky: body is static at clamped position — other cards collide with it
4. When sticky position changes (compression): update body dimensions and position
5. Cards pushed off-screen by the sticky search card despawn normally
6. Grid occupancy updates when search card moves to sticky position — release old cells, reserve new cells at clamped position

Verify:
- Pan right → search card sticks left → content cards flow around it
- Cards don't overlap the sticky search card
- Cards pushed off-screen by search card enter the queue
- Physics settling is smooth, no jitter

### Phase D: Polish

- Ensure search card has same entrance/exit animation as content cards
- Test with 9 cards, 48 cards, different themes
- Test edge compression in all 4 directions
- Remove dead exclusion zone code
- Update docs

## Key Decisions to Make

1. **Search card grid position:** Where does it start? Suggest: center of initial layout, cell (0, 0). Other cards spiral around it.

2. **Buffer around search card:** Currently we reserve a 4×3 zone. With physics collision, we may not need a buffer — physics handles separation. Start with no buffer, add if needed.

3. **Compression in canvas vs screen space:** The current compression math works in screen space. With the search card in canvas space, we need to convert. The clamped position should be computed in screen space (viewport edges) then converted back to canvas.

4. **Search card z-index:** When the search card is in the same layer as other cards, it needs to render on top. Use a higher z-index on the search card's motion.div.

## File Inventory

| File | Change Type | Notes |
|------|-------------|-------|
| `views/DesktopCanvasView.tsx` | Major | Remove overlay search, wire to card layer |
| `views/DesktopCardLayer.tsx` | Medium | Render search card alongside content cards |
| `cards/SearchMenuCard.tsx` | Medium | Change positionMode, accept canvas coords |
| `cards/useSearchCardState.ts` | Major | Rewrite: canvas position + edge clamping |
| `core/useBoardController.ts` | Medium | Add search card to visible map, never queue |
| `layout/positions.ts` | Small | Remove reserveSearchCard hack, place normally |
| `layout/gridOccupancy.ts` | Small | Remove reserveZone if unused |
| `physics/usePhysicsWorld.ts` | Medium | Search body: dynamic↔static transitions |
| `physics/forces.ts` | None | Already handles SEARCH_CARD_ID |
| `BentoGrid.constants.ts` | None | Existing search card constants fine |

## Risk / Complexity

This is the most complex change in the BentoGrid rebuild. The search card touches
rendering, layout, physics, and state management. The phased approach (A→B→C→D)
ensures each step is independently verifiable:

- After Phase A: search card in grid, no sticky (just scrolls off-screen)
- After Phase B: sticky behavior works, no physics collision
- After Phase C: full flow-around behavior
- After Phase D: polished and tested

Each phase should be a separate commit with visual verification.

# BentoGrid Rebuild Checklist

Use this file as the drift guard while rebuilding the active `BentoGrid`
implementation in place.

## Target Behavior

- [x] `/projects` and `/playground` keep the existing public `BentoGrid` API.
- [x] Desktop is an infinite 2D board with drag, wheel/pinch zoom, WASD panning,
  keyboard card focus, spawn/despawn, and physics settling.
- [x] Mobile remains a deliberate single-column fallback unless queue recycling
  is explicitly added later.
- [x] Search is always visible and never enters the card queue.
- [x] Search filters the other board cards.
- [x] Search free state looks like a normal card using the same shell/motion.
- [x] Search sticky state clamps to an edge and compresses proportionally.
- [x] Top/bottom sticky state becomes a compact horizontal bar.
- [x] Left/right sticky state becomes a usable vertical strip.
- [x] Non-search cards never squash.
- [x] Cards flow around sticky search without full-board reshuffle.
- [x] Cards pushed off-screen can despawn and return to the queue.
- [x] New cards spawn from the opposite movement edge.

## Architecture Rules

- [x] One active BentoGrid implementation, no `V2` package.
- [x] No separate `search/` visual package; search lives with cards.
- [x] `BaseCard` owns shared shell, focus, hover, entrance, and exit behavior.
- [x] Board membership and board positions are separate concerns.
- [x] Search projection, search physics body, and search exclusion rect are
  derived from the same logical slot.
- [x] Spawn/despawn uses current rendered/physics rects, not stale initial slots.
- [x] Tests cover behavior at layout/math boundaries, not incidental structure.

## Keep

- [ ] Page clients under `/projects` and `/playground`.
- [ ] `CardData` shape unless a required behavior needs a narrow addition.
- [ ] Theme tokens and current card content components.
- [ ] Camera/viewport helpers if tests and local behavior remain correct.

## Replace/Clean

- [x] Desktop orchestration if it has split sources of truth.
- [x] Layout around sticky search if it causes visible reshuffle.
- [x] Search body update if it can diverge from rendered projection.
- [x] Dead compatibility exports, stale docs, and disabled fake fixtures.

## Verification

- [x] `npm test -- BentoGrid`
- [x] `npm run type-check`
- [x] `npm run lint`
- [x] Local visual pass on `http://localhost:3003/projects`
- [x] Local visual pass on `http://localhost:3003/playground`

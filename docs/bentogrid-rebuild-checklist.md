# BentoGrid Rebuild Checklist

Use this file as the drift guard while rebuilding the active `BentoGrid`
implementation in place.

## Target Behavior

### Spawn/Queue (PRIORITY — currently broken)
- [ ] Viewport is always populated during panning at any speed.
- [ ] Spawn system runs at rAF rate, decoupled from React render cycle.
- [ ] Cards spawn distributed across the viewport interior, not clumped at edges.
- [ ] Despawn recycles cards smoothly; no card "ghosts" linger off-screen.
- [ ] Queue drains/refills as user pans; FIFO order maintained.
- [ ] Works correctly with 9 cards (no queue), 48+ cards (seeded queue).
- [ ] Momentum panning keeps viewport populated (rAF loop, not useEffect).

### Desktop
- [x] `/projects` and `/playground` keep the existing public `BentoGrid` API.
- [x] Infinite 2D board with drag, wheel/pinch zoom, WASD panning.
- [ ] Single click on card triggers selection (not swallowed by drag gesture).
- [x] Keyboard card focus and navigation.
- [ ] Cards never render on top of search card (z-index stacking fix).

### Search
- [x] Search is always visible and never enters the card queue.
- [x] Search filters the other board cards.
- [x] Search free state looks like a normal card using the same shell/motion.
- [x] Search sticky state clamps to an edge and compresses proportionally.
- [x] Top/bottom sticky state becomes a compact horizontal bar.
- [x] Left/right sticky state becomes a usable vertical strip.
- [x] Non-search cards never squash.
- [ ] Stuck search pushes/blocks cards through physics and layout targets.

### Cards
- [ ] No random rotation on any theme (rotationRange: 0 for all themes).
- [ ] Subtle entrance animation when cards spawn into viewport.
- [x] Cards pushed off-screen despawn and return to the queue.
- [x] Card hover and focus states work.

### Mobile
- [x] Mobile remains a deliberate single-column fallback.
- [x] Search/filter works on mobile.

## Architecture Rules

- [x] One active BentoGrid implementation, no `V2` package.
- [x] No separate `search/` visual package; search lives with cards.
- [x] `BaseCard` owns shared shell, focus, hover, entrance, and exit behavior.
- [x] `useBoardController` is the single board state hook.
- [x] `SEARCH_CARD_ID` constant, no magic strings.
- [x] `getMovementDirectionFromDelta` lives in `movement.ts` (single source).
- [ ] Spawn/despawn runs in rAF loop, not React useEffect.
- [x] Tests cover behavior at layout/math boundaries.

## Next Steps (in order)

1. **rAF spawn loop** — Move spawn/despawn out of useEffect into a
   requestAnimationFrame loop that reads camera from a ref. This is the
   critical fix for the empty-viewport-during-fast-pan bug.

2. **Z-index fix** — Ensure search card always renders above content cards.

3. **Remove rotation** — Set `rotationRange: 0` for all themes.

4. **Click vs drag** — Fix gesture discrimination so quick clicks work.

5. **Entrance animation** — Add subtle fade+scale when cards spawn.

6. **Remove dead code** — Delete `useCardPool.ts` and `useSpawnManager.ts`
   (replaced by `useBoardController`).

7. **Photography integration** — Add `PhotoCardData` type, `PhotoCard`
   component, gallery theme, `/photography` BentoGrid consumer.

## Verification

- [ ] `npm test -- BentoGrid`
- [ ] `npm run type-check`
- [ ] `npm run lint`
- [ ] Visual pass on `/projects` (normal + `?seed=1`)
- [ ] Visual pass on `/playground` (normal + `?seed=1`)
- [ ] Fast-pan stress test with 48+ cards — viewport always populated

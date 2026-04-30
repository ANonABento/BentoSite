# BentoGrid Behavior Checklist

These are the behavior requirements for the active BentoGrid system. Checked
items are implemented; unchecked items are remaining polish or tuning.

## Current Implementation Status

BentoGrid is the active shared grid for `/projects` and `/playground`. The
system lives under `src/components/BentoGrid/` with separate `core/`,
`layout/`, `physics/`, `cards/`, and `views/` areas.

## Search Card Behavior

### When on-screen (not at edge)
- [ ] Looks and behaves exactly like a regular card (same component, same size, same animations)
- [ ] Always visible — never despawns, never goes into the card queue
- [ ] Search/filter UI is always inside the card (not a modal/overlay)
- [ ] Clicking/typing filters the OTHER cards on the board (not results inside the card)
- [ ] Features: search input, category filters, breadcrumb, back button, card count
- [ ] Consistent animations with all other cards (currently different — fix this)

### When hitting an edge (sticky behavior)
- [ ] Card gets STUCK at the edge — doesn't scroll off-screen
- [ ] All other cards flow AROUND it with collision physics (like water around a rock)
- [ ] Other cards are NOT affected by edge squashing — only the search card squashes
- [ ] When dragged/scrolled back away from edge, smoothly expands back to full card and rejoins flow

### Edge-squash states
- [ ] **Top/bottom edge**: filter bar section collapses — becomes compact search bar only
- [ ] **Left/right edge**: card collapses into vertical sidebar strip — icons for back, search, actions
- [ ] Transition is smooth and proportional to how far off-screen the slot is (not binary)
- [ ] Min size must be bigger than current (currently shrinks too much)

## Other Cards (non-search)
- [ ] Flow around the stuck search card with physics (collision)
- [ ] If pushed off-screen by scrolling, they despawn and go back in the spawn queue
- [ ] New cards keep spawning from the opposite edge as user scrolls
- [ ] Cards arrange in bento layout that flows nicely around the search card's position
- [ ] No squashing behavior — only search card squashes at edges

## Grid System
- [x] Single consolidated grid system (not two separate ones)
- [ ] No duplicated code between grid components
- [ ] Shared components between search card and regular cards where possible
- [x] Physics-based card flow

## Animation & Polish
- [ ] All cards have consistent entrance/exit animations
- [ ] Search card animations match regular card animations
- [ ] Smooth spring physics for collision displacement
- [ ] Bento-style layout (cards fit together like a grid, not random positions)

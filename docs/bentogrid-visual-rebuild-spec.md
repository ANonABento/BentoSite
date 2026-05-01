# BentoGrid Visual Rebuild Spec

This spec covers the visual rebuild only. The current internal board/controller
work can stay as the mechanical base, but the experience still needs a stronger
visual direction.

## Current Visual Diagnosis

The current grid reads as a generic floating-card canvas, not a tactile bento
board. Cards are functional, but they do not yet feel composed, dense, or
intentional.

Main drift:

- The board starts as a loose spiral/ring around search instead of a satisfying
  packed bento composition.
- Search is technically a card, but visually it still reads like an overlay
  control panel.
- Project and game cards use separate visual languages, but neither page has a
  strong board-level art direction.
- Card density is low. There is too much empty space around the center and not
  enough edge-to-edge bento packing.
- Search stuck states exist mechanically, but the top/bottom bar and side strip
  need a designed compact layout, not just hidden content.
- Physics motion is present, but the board lacks visual affordances that make
  motion feel tactile: shadows, depth, collision response, layering, and
  momentum cues.
- The background is passive. It does not help the user understand that they are
  moving across an infinite canvas.
- The debug HUD and reset button are visually prominent in development, which
  makes the local experience feel unfinished while reviewing.

## Product Intent

BentoGrid should feel like a draggable, physical desktop of cards. It should be
playful on `/playground`, refined on `/projects`, and coherent on both.

User impression target:

- "This is a custom spatial interface."
- "Search is one of the cards, but it is special and persistent."
- "The board has weight, depth, and a clear design system."
- "Dragging/panning reveals more of the same world, not a normal webpage with
  animated cards."

## Open Questions To Lock Before Implementation

Locked answers:

- Initial load should feel packed like a true bento composition.
- Search starts dead center as the anchor card.
- Cards bend/pack around search.
- Collisions should sit between physical realism and fast settling: tactile,
  but not chaotic or slow.
- `/projects` and `/playground` share the same geometry with different skins.
- Featured project cards should dominate the first viewport. Less important
  cards can start farther out or queued.
- Game cards should explore an arcade-cartridge direction.
- `/projects` and `/playground` should have distinct backgrounds. Explore a few
  directions in a quick HTML preview before committing.
- Left/right stuck search should become a pure icon rail.
- Category filters should start visible/discoverable. They can compact or hide
  later if the UI feels too heavy.
- Projects and playground visual vibes should be explored through examples
  before locking final direction.

## Visual Direction

### Shared Board

- Use a visible infinite-canvas treatment: subtle grid dots, depth gradient, and
  a soft radial focus behind the initial board.
- Use card shadows that imply physical stacking. Hover and physics displacement
  should lift cards rather than just scale them.
- Use a tighter packing rhythm: cards should appear interlocked with consistent
  gutters, not randomly scattered.
- Introduce board-level layering: search above cards, focused/hovered cards
  above normal cards, exiting/spawning cards briefly above the board.
- Make panning legible with a background pattern that moves with the canvas,
  while fixed UI remains fixed.
- Use one deterministic packed layout for both routes. Skins can change, but
  card geometry and first-load composition should match.

### Projects Theme

Target: premium portfolio desk.

- Sharper glass cards with stronger hierarchy and quieter motion.
- Larger featured cards should show richer preview content and stronger titles.
- Small cards should not look like cropped versions of large cards; they need a
  compact variant with fewer elements.
- Use restrained accent color from existing CSS variables, not hardcoded violet
  utility colors.
- Favor editorial typography: title, short description, status, technologies,
  and primary action should have clear priority.

### Playground Theme

Target: arcade toy shelf.

- Cards should feel like playful cartridges or machine tiles, not generic neon
  boxes.
- Use bolder color per game, icon badges, score/action zones, and visible
  hover affordances.
- Keep neon, but reduce arbitrary hardcoded colors and make the palette feel
  intentional across the board.
- Use slight rotation and bounce, but preserve bento alignment so it does not
  look randomly scattered.
- Explore arcade cartridge treatments: top label strip, screen/icon zone,
  bottom score/action rail, and colored plastic/material accents.

### Search Card

Search must become the visual keystone.

- Free state: same card shell dimensions and depth as content cards, but with a
  command-card composition: breadcrumb, input, count, category affordance.
- Top/bottom sticky state: compact horizontal command bar with back, input,
  count, filter toggle, and clear button.
- Left/right sticky state: pure designed icon rail. It should include back,
  search, filter indicator, result count, and expand affordance. Do not preserve
  a narrow text input in this state unless testing proves the rail is unclear.
- Compression should interpolate layout intentionally. Elements should morph or
  reflow, not simply disappear abruptly.
- Search body, exclusion rect, and rendered shell must remain visually aligned.

## Layout Requirements

- Replace the initial loose spiral with a packed bento placement pass.
- The first viewport should feel intentionally composed at `1440x1000`.
- Search should reserve a real card slot in the initial composition.
- Featured cards get deterministic dominant large slots in the first viewport.
- Smaller cards fill gaps around large cards instead of expanding outward too
  early.
- Keep rotation at zero for premium and subtle for playful.
- Preserve current queue/spawn behavior after the initial packed layout.

## Interaction Requirements

- Hover: cards lift with shadow/depth and reveal action affordances.
- Focus: keyboard focus must be visible and not rely only on glow.
- Dragging/panning: active cursor and subtle board movement cues.
- Spawn: cards should enter from the movement edge with a clear arrival
  animation and settle into the board.
- Despawn: cards should leave cleanly without popping.
- Filtering: non-matching cards should exit/soft-hide; matching cards should
  repack/settle. Do not hard reset the entire board visually.
- Reset: reset should feel like returning to the composed board, not snapping
  to arbitrary coordinates.

## Implementation Plan

1. Create visual state inventory.
   Capture desktop states for free search, top/bottom stuck search, side stuck
   search, hover, focus, filtering, spawn, and mobile.

2. Rebuild initial placement.
   Replace spiral start with deterministic packed bento layout that reserves
   search and featured slots.

3. Redesign BaseCard.
   Add board-aware depth, surface variants, focus rings, hover lift, and theme
   hooks without duplicating shell code in project/game/search cards.

4. Redesign SearchMenuCard.
   Build explicit free, horizontal-stuck, and vertical-stuck compositions that
   share state and transition cleanly.

5. Redesign ProjectCard.
   Add large/small variants with premium hierarchy and remove hardcoded visual
   drift where possible.

6. Redesign GameCard.
   Add playful cartridge/tile variants with consistent palette and card-size
   variants.

7. Add board background and fixed controls polish.
   Make the canvas feel spatial and hide or demote dev-only controls.

8. Tune physics and filtering visually.
   Keep the current controller, but make transitions look intentional.

9. Update tests/docs.
   Add layout tests for packed placement and update handoff/checklists so
   visual completion is not confused with mechanical completion.

## Acceptance Criteria

- At first load, `/projects` looks like a composed premium bento board.
- At first load, `/playground` looks like a composed playful arcade bento board.
- Search free state reads as a card, not a floating web form.
- Search top/bottom sticky state is a usable command bar.
- Search side sticky state is a designed rail, not hidden broken content.
- Cards are denser and more intentionally packed than the current spiral.
- Hover/focus/spawn/filter states are visibly designed.
- No hardcoded Tailwind color drift is introduced where CSS variables should be
  used.
- `npm test -- BentoGrid`, `npm run type-check`, `npm run lint`, and local
  browser checks pass.

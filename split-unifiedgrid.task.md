# Split UnifiedGrid Into Smaller Responsibility-Focused Modules

## Objective

Refactor the oversized `UnifiedGrid` implementation into smaller files that match this repo's component conventions without changing runtime behavior, public exports, or the way `/projects` and `/playground` use the grid.

This is a pure refactor. No UX changes, no API rewrites for existing callers, no new features.

## Codebase Read Summary

I read `CLAUDE.md` first, then inspected the current `UnifiedGrid` package, its pages, its barrels, and adjacent repo patterns.

Observed patterns that matter for this plan:

- The repo prefers responsibility-split component modules such as `Dimension.tsx`, `Dimension.types.ts`, `Dimension.hooks.ts`, `Dimension.config.ts`, `Dimension.3d.tsx`, and `Dimension.ui.tsx`.
- `UnifiedGrid` already uses internal sub-areas (`cards/`, `core/`, `themes/`) and a root barrel. Adding `views/` and `core/cardQueue/` fits the existing organization style.
- Public consumption is barrel-driven. Current external imports are limited and easy to verify:
  - `src/app/projects/page.tsx`
  - `src/app/playground/page.tsx`
- `src/components/UnifiedGrid/index.ts` re-exports both runtime values and public types. That export surface must remain stable.
- `src/components/UnifiedGrid/cards/index.ts` and `src/components/UnifiedGrid/core/index.ts` are the package's internal organization seams. They are the right place to add internal re-exports needed by the split.
- `SearchMenuCard.tsx` currently duplicates icons already centralized in `src/components/ui/Icons.tsx`, except for `ArrowLeftIcon`, which does not exist there yet.
- `UnifiedGrid.tsx` contains a real duplicate of `useCardQueue`'s filtering logic in the mobile view. Removing that duplication is a refactor cleanup, not a behavior change, because the code paths are intended to stay in parity.

## Confirmed Current Surface

Current oversized files:

| File | Current lines | Main concerns mixed together |
|---|---:|---|
| `src/components/UnifiedGrid/UnifiedGrid.tsx` | 532 | Public props, default renderer, mobile view, desktop view, dispatch |
| `src/components/UnifiedGrid/cards/SearchMenuCard.tsx` | 462 | Inline icons, props, collapsed UI, expanded UI, dispatch |
| `src/components/UnifiedGrid/core/useCardQueue.ts` | 418 | Pure helpers plus the stateful hook |

Current public imports that must keep working:

```ts
import { UnifiedGrid } from '@/components/UnifiedGrid';
import type {
  ProjectCardData,
  GameCardData,
  CardData,
  CardPosition,
  ThemeConfig,
} from '@/components/UnifiedGrid';
import { ProjectCard, GameCard } from '@/components/UnifiedGrid/cards';
```

The only intentional public API addition in this refactor should be a `RenderCard` type alias, because the render function signature is currently duplicated inline and is a good fit for `UnifiedGrid.types.ts`.

## Constraints

- Keep all existing behavior the same.
- Keep the root `UnifiedGrid` barrel usable by the existing pages with no import-path churn.
- Keep files under the repo's preferred size threshold and split by responsibility.
- Preserve explanatory comments that capture non-obvious behavior, especially:
  - the movement-direction sign convention in `useSpawnManager.ts`
  - the render-time state sync note in `useSearchCardState.ts`
  - the debounce comment in `SearchMenuCard.tsx`
- Do not reorganize unrelated areas such as `themes/`, `ProjectCard`, `GameCard`, `useViewport`, or `useSpawnManager`.
- Use shared icons from `@/components/ui/Icons` instead of keeping local SVG duplicates.

## Target Layout

```text
src/components/UnifiedGrid/
├── UnifiedGrid.tsx
├── UnifiedGrid.constants.ts
├── UnifiedGrid.types.ts
├── index.ts
├── views/
│   ├── DefaultCard.tsx
│   ├── MobileScrollView.tsx
│   └── DesktopCanvasView.tsx
├── cards/
│   ├── GameCard.tsx
│   ├── ProjectCard.tsx
│   ├── SearchMenuCard.tsx
│   ├── SearchMenuCard.collapsed.tsx
│   ├── SearchMenuCard.expanded.tsx
│   ├── index.ts
│   └── useSearchCardState.ts
└── core/
    ├── index.ts
    ├── useCardNavigation.ts
    ├── useCardQueue.ts
    ├── useGridNavigation.ts
    ├── useSpawnManager.ts
    ├── useViewport.ts
    └── cardQueue/
        ├── filter.ts
        └── positions.ts
```

## Phase 1: Normalize Shared Type Surface

### Files touched

- `src/components/UnifiedGrid/UnifiedGrid.types.ts`
- `src/components/UnifiedGrid/UnifiedGrid.tsx`
- `src/components/UnifiedGrid/index.ts`

### Plan

Add a named `RenderCard` type alias to `UnifiedGrid.types.ts` and use it in `UnifiedGridProps`.

Suggested type:

```ts
export type RenderCard = (
  card: CardData,
  position: CardPosition,
  theme: ThemeConfig,
  isFocused?: boolean,
  onClick?: () => void,
) => React.ReactNode;
```

Why this belongs in `UnifiedGrid.types.ts`:

- That file is already the public type hub for the package.
- It avoids type-only circular imports between `UnifiedGrid.tsx` and extracted view files.
- It matches the repo's existing pattern of centralizing shared package types.

### Invariants

- `UnifiedGridProps` remains exported from `UnifiedGrid.tsx`.
- Existing external page imports remain valid.
- The root barrel adds `RenderCard` to the exported type list and changes nothing else about its runtime exports.

## Phase 2: Split `useCardQueue` Into Hook Plus Pure Helpers

### Files touched

- `src/components/UnifiedGrid/core/useCardQueue.ts`
- `src/components/UnifiedGrid/core/cardQueue/positions.ts`
- `src/components/UnifiedGrid/core/cardQueue/filter.ts`
- `src/components/UnifiedGrid/core/index.ts`

### Plan

Move pure helper logic out of `useCardQueue.ts` so the hook file becomes stateful orchestration only.

#### `core/cardQueue/positions.ts`

Move these functions here:

- `getCardSize`
- `getRandomRotation`
- `generateSpiralPositions`
- `rectsOverlap`
- `calculateInitialPositions`

Only `calculateInitialPositions` needs to be exported. The other helpers should stay file-private unless tests or future reuse require otherwise.

This file should keep the current algorithm and comments intact:

- reserved center space for the search card
- spiral placement
- collision avoidance
- centering around origin

#### `core/cardQueue/filter.ts`

Move `filterCards(cards, searchTerm, category)` here as a named export.

Important behavior to preserve:

- category equality filtering
- lowercase trimmed search term
- search across `title`, `description`, and `category`
- project-only technology matching via `technologies?.some(...)`

#### `core/useCardQueue.ts`

Leave only:

- `UseCardQueueOptions`
- the `useCardQueue` hook

It should import:

- `calculateInitialPositions` from `./cardQueue/positions`
- `filterCards` from `./cardQueue/filter`

#### `core/index.ts`

Add:

```ts
export { filterCards } from './cardQueue/filter';
```

That keeps mobile-view imports clean without exposing helper internals through the root package barrel.

### Why this phase comes first

- It is the safest extraction because the helpers are already logically separate.
- It enables the `UnifiedGrid` mobile view to reuse the same filter function later in the refactor.

## Phase 3: Split `SearchMenuCard` and Consolidate Icons

### Files touched

- `src/components/UnifiedGrid/cards/SearchMenuCard.tsx`
- `src/components/UnifiedGrid/cards/SearchMenuCard.collapsed.tsx`
- `src/components/UnifiedGrid/cards/SearchMenuCard.expanded.tsx`
- `src/components/ui/Icons.tsx`

### Plan

Extract the collapsed and expanded UI blocks into sibling files and replace local SVG definitions with shared icons.

#### `src/components/ui/Icons.tsx`

Add:

```ts
export const ArrowLeftIcon = createIcon(
  <>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </>
);
```

This matches the existing `createIcon` API and the local `SearchMenuCard` icon shape closely enough to avoid behavior drift.

#### `cards/SearchMenuCard.collapsed.tsx`

Export a named `CollapsedBar`.

Prop shape:

```ts
Pick<
  SearchMenuCardProps,
  'theme' | 'edge' | 'position' | 'searchTerm' | 'onSearchChange' | 'onToggleExpanded' | 'onBack'
>
```

Keep current behavior as-is:

- width computed from `window.innerWidth` when available
- back button remains optional
- clear button only shows when search has content
- expand button remains the last control

Use shared icons:

- `SearchIcon`
- `ChevronDownIcon`
- `CloseIcon`
- `ArrowLeftIcon`

#### `cards/SearchMenuCard.expanded.tsx`

Export a named `ExpandedCard`.

Prop shape:

```ts
Omit<SearchMenuCardProps, 'expanded' | 'edge'> & {
  position: { x: number; y: number };
}
```

Keep these details unchanged:

- local debounced search state
- debounce effect timing using `PERFORMANCE.SEARCH_DEBOUNCE`
- the comment explaining why redundant debounce work is skipped
- initial focus effect on mount
- current category pill behavior and footer count text

#### `cards/SearchMenuCard.tsx`

Reduce to:

- `SearchMenuCardProps`
- the `AnimatePresence` dispatch between `ExpandedCard` and `CollapsedBar`
- default export

### Invariants

- `cards/index.ts` keeps exporting `SearchMenuCard` and `SearchMenuCardProps` from `./SearchMenuCard`.
- No external imports need to change.
- There should be no remaining local SVG definitions for search-card icons after the split.

## Phase 4: Split `UnifiedGrid.tsx` Into Dispatch Plus View Components

### Files touched

- `src/components/UnifiedGrid/UnifiedGrid.tsx`
- `src/components/UnifiedGrid/views/DefaultCard.tsx`
- `src/components/UnifiedGrid/views/MobileScrollView.tsx`
- `src/components/UnifiedGrid/views/DesktopCanvasView.tsx`

### Plan

Extract the internal view implementations into `views/` and leave `UnifiedGrid.tsx` as the composition entry point.

#### `views/DefaultCard.tsx`

Move the fallback renderer here with the same inline prop shape:

- `card`
- `position`
- `theme`
- `onClick`
- `isFocused`

This should remain internal-only. It does not need root or barrel exports.

#### `views/MobileScrollView.tsx`

Move the mobile list implementation here.

Required adjustment:

Replace the duplicated inline filter logic with the extracted helper:

```ts
const localFilteredCards = useMemo(
  () => filterCards(cards, searchTerm, category),
  [cards, searchTerm, category],
);
```

Imports should come from existing package seams:

- `SearchMenuCard`, `useSearchCardState` from `../cards`
- `useWindowSize`, `filterCards` from `../core`
- `MOBILE` from `../UnifiedGrid.constants`
- `DefaultCard` from `./DefaultCard`

Behavior to keep unchanged:

- mobile stays local-state-driven and does not use `useCardQueue`
- mobile search state still flows through `useSearchCardState({ isMobile: true })`
- card wrapper stays relatively positioned so absolute-positioned card renderers still lay out correctly inside the scroll column

#### `views/DesktopCanvasView.tsx`

Move the desktop infinite-canvas implementation here.

Keep unchanged:

- `useGridNavigation` with persisted camera key by theme name
- `useCardQueue`
- `useViewport`
- `useSpawnManager`
- `useSearchCardState`
- `useCardNavigation`
- `/`, `f`, and `Backspace` keyboard shortcuts
- `getCameraTransform(...)`
- development-only debug overlay

Imports should remain package-local and match current structure:

- core hooks from `../core`
- `SearchMenuCard`, `useSearchCardState` from `../cards`
- constants from `../UnifiedGrid.constants`
- `DefaultCard` from `./DefaultCard`

#### `UnifiedGrid.tsx`

After extraction, this file should contain only:

- imports
- `UnifiedGridProps`
- theme lookup
- category derivation
- mobile/desktop branch
- default export

### Invariants

- The root `UnifiedGrid` public API remains the same.
- `renderCard` continues to be passed through unchanged to both mobile and desktop views.
- No runtime behavior changes for selection, search, reset, or keyboard flow.

## Import and Barrel Strategy

### Root barrel: `src/components/UnifiedGrid/index.ts`

Keep all current exports.

Only planned change:

- add `RenderCard` to the type export list

Do not export new internal view files from the root.

### Cards barrel: `src/components/UnifiedGrid/cards/index.ts`

Keep as-is.

No additional re-exports are necessary because the extracted collapsed/expanded files are implementation details.

### Core barrel: `src/components/UnifiedGrid/core/index.ts`

Add `filterCards` because the mobile view is part of the same package and should consume the shared helper through the internal barrel.

Do not expose `calculateInitialPositions` from the barrel unless a real consumer appears.

## Verification Plan

### Static verification

Run after each phase:

```bash
npm run type-check
npm run lint
```

Run at the end:

```bash
npm test
```

### Grep verification

Confirm public import shapes remain stable:

```bash
git grep "from '@/components/UnifiedGrid'"
git grep "from '@/components/UnifiedGrid/cards'"
```

Expected outcome:

- existing import sites still resolve without changes
- only new optional public type is `RenderCard`

### Structural verification

Check file sizes after the split:

```bash
find src/components/UnifiedGrid -type f \\( -name '*.ts' -o -name '*.tsx' \\) -print0 | xargs -0 wc -l
```

Target:

- no `UnifiedGrid` package file should remain above roughly 250-300 lines

### Behavioral verification

Desktop:

- `/projects` renders and cards still pan, despawn, and respawn
- `/playground` renders and custom card renderers still receive the same props
- `/` or `f` expands the search card
- `Backspace` triggers `onBack` when focus is not inside an input
- keyboard card focus and reset button still work

Mobile viewport:

- collapsed search bar stays pinned at the top
- filtering still matches desktop behavior, including project technology search
- cards still render in a scroll flow without layout breakage
- back button still works from the collapsed search bar

Search card specifics:

- expanded view auto-focuses the input
- debounce behavior remains unchanged
- clear buttons still clear correctly in both collapsed and expanded states

### Code hygiene verification

Confirm these cleanups were achieved:

- no inline `SearchIcon`, `ChevronDownIcon`, `XIcon`, or `ArrowLeftIcon` definitions remain in `SearchMenuCard` files
- no duplicated mobile filter implementation remains in `UnifiedGrid.tsx`

## Risks and Mitigations

### Risk: Type extraction introduces import cycles

Mitigation:

- put `RenderCard` in `UnifiedGrid.types.ts`, which is already a dependency-safe shared type file

### Risk: Shared icon component defaults differ slightly from local SVGs

Mitigation:

- pass explicit sizing and existing class names where needed
- use `CloseIcon` for the previous local `XIcon`

### Risk: Mobile filter behavior drifts from desktop queue behavior

Mitigation:

- use the same extracted `filterCards` helper in both places
- explicitly verify technology search for project cards

### Risk: Refactor accidentally expands the public surface too far

Mitigation:

- only export `RenderCard` from the root barrel
- keep extracted `views/` files and search subcomponents internal

## Recommended Execution Order

1. Add `ArrowLeftIcon` to `src/components/ui/Icons.tsx`.
2. Extract `filterCards` and position helpers out of `useCardQueue.ts`.
3. Update `core/index.ts` to export `filterCards`.
4. Split `SearchMenuCard.tsx` into dispatch, collapsed, and expanded files.
5. Add `RenderCard` to `UnifiedGrid.types.ts` and wire `UnifiedGridProps` to use it.
6. Split `UnifiedGrid.tsx` into `views/DefaultCard.tsx`, `views/MobileScrollView.tsx`, and `views/DesktopCanvasView.tsx`.
7. Run final type-check, lint, tests, and quick manual verification on `/projects` and `/playground`.

## Done Definition

This refactor is complete when all of the following are true:

- `UnifiedGrid.tsx`, `SearchMenuCard.tsx`, and `useCardQueue.ts` have been reduced to focused modules
- the package still exports the same runtime surface
- the only new public type is `RenderCard`
- no relevant file exceeds the repo's preferred file-size threshold
- lint, type-check, and tests pass
- `/projects` and `/playground` behave the same on desktop and mobile

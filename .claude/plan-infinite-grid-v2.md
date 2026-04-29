# Unified Infinite Grid - Implementation Plan v2

> Supersedes: `plan.md` (InfiniteGrid v1 - now implemented)

---

## Overview

Refactor both **Playground** and **Projects** into separate pages using a shared infinite grid system with:
- Queue-based card recycling (remove → queue → spawn)
- 4-directional card spawning on desktop
- Single column vertical scroll on mobile
- Morphing search card (card → bar on edge)
- Contrasting visual themes

---

## Current State → Target State

```
CURRENT:
┌─────────────────┐    ┌─────────────────────┐
│  / (Dashboard)  │ →  │ InfiniteGrid Modal  │ (Projects overlay)
│                 │    └─────────────────────┘
│  /playground    │ ← BentoHub (CSS Grid + custom physics)
└─────────────────┘

TARGET:
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│  / (Dashboard)  │ →  │ /playground         │ →  │ /projects           │
│                 │    │ UnifiedGrid         │    │ UnifiedGrid         │
│                 │    │ (Playful theme)     │    │ (Premium theme)     │
└─────────────────┘    └─────────────────────┘    └─────────────────────┘
```

---

## Requirements

### Core Grid Mechanics

| Feature | Desktop | Mobile |
|---------|---------|--------|
| Layout | Infinite 2D canvas | Single column scroll |
| Navigation | Drag/pan, WASD, scroll | Vertical scroll only |
| Card recycling | Queue-based, 4 directions | Queue-based, top/bottom |
| Card respawn | When card exits viewport | When card exits viewport |

### Card Queue System

```
┌─────────────────────────────────────┐
│          VISIBLE VIEWPORT           │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐     │
│  │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │     │
│  └───┘ └───┘ └───┘ └───┘ └───┘     │
└─────────────────────────────────────┘
         │ pan right →
         ▼
┌─────────────────────────────────────┐
│          VISIBLE VIEWPORT           │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐     │
│  │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 1 │ ← respawned from queue
│  └───┘ └───┘ └───┘ └───┘ └───┘     │
└─────────────────────────────────────┘

Queue: [cards that exited left] → spawn on right edge
```

**Algorithm:**
1. All cards start in a queue (ordered)
2. Initial spawn: place cards around center
3. On exit: card removed from DOM, ID added to queue
4. On spawn needed: pop from queue, position at spawn edge
5. Cards cycle infinitely: `remove → queue → spawn`

### Search/Menu Card

**States:**

```
┌─────────────────────────────────────┐
│  EXPANDED (Center/Floating)         │
│  ┌─────────────────────────────────┐│
│  │ [← Back]  bentOS / playground   ││
│  │ ┌─────────────────────────────┐ ││
│  │ │ 🔍 Search games...          │ ││
│  │ └─────────────────────────────┘ ││
│  │ [All] [Reaction] [Puzzle] ...   ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  COLLAPSED (Edge Bar)               │
│  ┌─────────────────────────────────┐│
│  │ [←] [🔍 Search...] [☰]         ││
│  └─────────────────────────────────┘│
│                                     │
│       Cards fill the space          │
│                                     │
└─────────────────────────────────────┘
```

**Behavior:**
- Spawns centered on page load
- Always visible (fixed to viewport, not canvas)
- When panned/scrolled near edge → collapses to bar
- Tap/click bar → expands back to card
- Contains: Back button, search, category filters

### Visual Themes

**Playground (Playful):**
```css
/* Bold, fun, energetic */
--bg: radial-gradient(circle at center, #1a0a2e, #0d0415);
--card-bg: linear-gradient(135deg, #ff00ff20, #00ffff10);
--card-border: 2px solid rgba(255, 0, 255, 0.3);
--card-radius: 20px;
--card-shadow: 0 0 30px rgba(255, 0, 255, 0.2);
--card-rotation: random(-3deg, 3deg); /* Slight tilt */
--accent: #ff00ff, #00ffff, #ffff00;
```

**Projects (Premium):**
```css
/* Stark, professional, sophisticated */
--bg: linear-gradient(180deg, #0a0a0a, #111111);
--card-bg: rgba(20, 20, 20, 0.8);
--card-border: 1px solid rgba(255, 255, 255, 0.08);
--card-radius: 8px;
--card-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
--card-rotation: 0deg; /* No tilt - clean lines */
--accent: #8b5cf6; /* Single violet accent */
```

---

## Technical Architecture

### Shared Module Structure

```
src/components/UnifiedGrid/
├── index.ts                      # Barrel exports
├── UnifiedGrid.tsx               # Main component
├── UnifiedGrid.types.ts          # Shared TypeScript interfaces
├── UnifiedGrid.constants.ts      # Shared configuration
│
├── core/
│   ├── useCardQueue.ts           # Queue-based recycling
│   ├── useViewport.ts            # Viewport tracking
│   ├── useSpawnManager.ts        # Card spawn/despawn logic
│   └── useGridNavigation.ts      # Pan, zoom, WASD
│
├── cards/
│   ├── GridCard.tsx              # Base card wrapper
│   ├── SearchMenuCard.tsx        # Morphing search card
│   └── CardRenderer.tsx          # Renders card content by type
│
├── themes/
│   ├── playful.ts                # Playground theme config
│   └── premium.ts                # Projects theme config
│
└── mobile/
    ├── MobileScroll.tsx          # Single column scroll view
    └── useMobileScroll.ts        # Scroll-based recycling
```

### Page Integration

```
src/app/playground/
├── page.tsx                      # Uses UnifiedGrid with playful theme
└── [game]/page.tsx               # Individual game pages (unchanged)

src/app/projects/
├── page.tsx                      # NEW: Uses UnifiedGrid with premium theme
└── [id]/page.tsx                 # Optional: Project detail page
```

### Key Interfaces

```typescript
// UnifiedGrid.types.ts

interface GridConfig {
  theme: 'playful' | 'premium';
  cards: CardData[];
  onCardSelect: (card: CardData) => void;
  onBack: () => void;
}

interface CardData {
  id: string;
  type: 'game' | 'project';
  title: string;
  description?: string;
  thumbnail?: string;
  category?: string;
  // Game-specific
  bestScore?: number;
  href?: string;
  // Project-specific
  technologies?: string[];
  links?: { github?: string; demo?: string };
}

interface CardQueueState {
  visible: Set<string>;       // Currently rendered card IDs
  queue: string[];            // IDs waiting to spawn
  positions: Map<string, Position>;
}

interface SpawnEdge {
  direction: 'top' | 'bottom' | 'left' | 'right';
  position: { x: number; y: number };
}

interface SearchMenuState {
  expanded: boolean;
  edge: 'none' | 'top' | 'bottom' | 'left' | 'right';
  searchTerm: string;
  category: string | null;
}
```

---

## Implementation Phases

### Phase 1: Core Infrastructure

**Task 1.1: Create shared types and constants**
- `UnifiedGrid.types.ts` - All interfaces
- `UnifiedGrid.constants.ts` - Grid sizing, thresholds, physics

**Task 1.2: Card queue system**
- `useCardQueue.ts` - Queue state management
- Initialization from card data
- Enqueue/dequeue operations

**Task 1.3: Viewport and spawn management**
- `useViewport.ts` - Track visible area, detect edges
- `useSpawnManager.ts` - Decide when/where to spawn cards

**Task 1.4: Base grid component**
- `UnifiedGrid.tsx` - Container, coordinate transforms
- Desktop pan/zoom navigation
- Card rendering with queue system

### Phase 2: Search Menu Card

**Task 2.1: Search card component**
- `SearchMenuCard.tsx` - Expandable/collapsible
- Search input with filtering
- Category filter buttons
- Back to dashboard button

**Task 2.2: Edge detection and morphing**
- Detect proximity to viewport edges
- Animate card → bar transformation
- Handle tap-to-expand on collapsed state

**Task 2.3: Search functionality**
- Filter cards by search term
- Filter cards by category
- Update queue with filtered results

### Phase 3: Theme System

**Task 3.1: Theme configuration**
- `themes/playful.ts` - Playground colors, effects
- `themes/premium.ts` - Projects colors, effects
- CSS variables for runtime theming

**Task 3.2: Card styling per theme**
- Playful: rounded, tilted, glowing
- Premium: sharp, flat, subtle

**Task 3.3: Background effects**
- Playful: Keep CRT shader (optional)
- Premium: Subtle gradient, no shader

### Phase 4: Mobile Implementation

**Task 4.1: Mobile scroll view**
- `MobileScroll.tsx` - Single column layout
- `useMobileScroll.ts` - Scroll-based recycling
- IntersectionObserver for visibility

**Task 4.2: Mobile search bar**
- Sticks to top when scrolled
- Collapses to compact bar
- Pull-down to expand

**Task 4.3: Responsive switching**
- Detect mobile vs desktop
- Render appropriate component
- Shared card components

### Phase 5: Page Integration

**Task 5.1: Refactor /playground**
- Replace BentoHub with UnifiedGrid
- Pass game cards and playful theme
- Handle game navigation

**Task 5.2: Create /projects page**
- New page using UnifiedGrid
- Pass project cards and premium theme
- Handle project selection

**Task 5.3: Update Dashboard navigation**
- Link to /playground (already exists)
- Link to /projects (new)
- Remove InfiniteGrid modal

### Phase 6: Polish

**Task 6.1: Animations**
- Card spawn/despawn transitions
- Search card morph animation
- Page enter/exit transitions

**Task 6.2: Performance**
- Virtualization (only render visible)
- Debounced search
- Optimized re-renders

**Task 6.3: Accessibility**
- Keyboard navigation
- Screen reader announcements
- Focus management

---

## Migration Strategy

```
Step 1: Build UnifiedGrid alongside existing components
        └── No changes to current pages

Step 2: Create /projects page with UnifiedGrid
        └── InfiniteGrid modal still works

Step 3: Update /playground to use UnifiedGrid
        └── BentoHub still exists (unused)

Step 4: Update Dashboard navigation
        └── Remove modal trigger, add /projects link

Step 5: Clean up
        └── Delete BentoHub, InfiniteGrid, ProjectsModal
```

---

## Reusable from Existing Code

| From | What to Reuse |
|------|---------------|
| InfiniteGrid | Coordinate transforms, viewport math |
| InfiniteGrid | Search filtering logic |
| InfiniteGrid | Card layout algorithm (modified for queue) |
| BentoHub | Game card content/styling |
| BentoHub | Best score display |
| BentoHub | CRT background shader |
| ProjectCard | Project content/styling |
| projects-data.ts | Project data + helpers |
| BentoHub.config.ts | Game card definitions |

---

## Open Questions (From Earlier)

Answers provided by user:

1. **Card recycling**: Queue-based, cycle through all cards
2. **Playground cards**: Current 9 games, will add more
3. **Projects cards**: Current set, will add more
4. **Search bar transform**: Card → bar (need to finalize exact UI)
5. **Search always visible**: Yes, pinned to viewport
6. **Site structure**: Dashboard → /playground or /projects
7. **Mobile layout**: Single column vertical scroll
8. **Mobile gestures**: Vertical only, no horizontal
9. **Playground style**: Bright, rounded, tilted

**Still need answers:**
- Search bar collapsed UI: `[← Back] [Search...] [Filter ▼]` or simpler?
- Card respawn: Immediate wrap or delayed organic feel?
- Project card simplification: Keep full content or simplify?

---

## Open Questions - RESOLVED

| Question | Answer |
|----------|--------|
| Search bar collapsed UI | Compact row: `[← Back] [🔍 Search...] [Filter ▼]` |
| Search card clickable? | **No** - it's a control panel, not a navigable card |
| Card respawn timing | Pool/queue with delay (FILO - organic feel) |
| Project card content | Keep current design, use shared components |
| Playground cards | Current 9 games, extensible |
| Site structure | Dashboard → /playground or /projects (separate pages) |
| Mobile layout | Single column vertical scroll |

---

## Detailed Design Decisions

### Search/Menu Card Behavior

```
EXPANDED STATE (floating in grid):
┌─────────────────────────────────────┐
│ bentOS / playground                 │
├─────────────────────────────────────┤
│ [← Back to Dashboard]               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔍 Search games...              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [All] [Reaction] [Puzzle] [Music]   │
│ [Strategy] [Reflex]                 │
└─────────────────────────────────────┘

COLLAPSED STATE (edge bar):
┌─────────────────────────────────────────────────┐
│ [←] │ 🔍 Search...              │ [Filter ▼]   │
└─────────────────────────────────────────────────┘

- Click [←] → Navigate to Dashboard
- Type in search → Filters visible cards
- Click [Filter ▼] → Expands back to full card
- Card itself is NOT clickable (no navigation)
```

### Card Queue System (FILO)

```
INITIAL STATE:
Queue: [A, B, C, D, E, F, G, H, I]
Visible: [A, B, C, D, E] (spawned around center)

USER PANS RIGHT:
1. Card A exits left viewport
2. A removed from DOM, pushed to queue END
   Queue: [F, G, H, I, A]
3. After small delay (~100ms), pop F from queue FRONT
4. F spawns at right edge with entrance animation
   Visible: [B, C, D, E, F]

EFFECT: Cards cycle through in order, with organic delays
```

### Shared Component Architecture

```
src/components/UnifiedGrid/
├── core/                         # Logic hooks (no UI)
│   ├── useCardQueue.ts           # FILO queue management
│   ├── useViewport.ts            # Viewport bounds tracking
│   ├── useSpawnManager.ts        # Spawn timing + positioning
│   └── useGridNavigation.ts      # Pan, WASD, momentum
│
├── cards/
│   ├── BaseCard.tsx              # Shared card wrapper (position, animation)
│   ├── GameCard.tsx              # Game-specific content (uses BaseCard)
│   ├── ProjectCard.tsx           # Project-specific content (uses BaseCard)
│   └── SearchMenuCard.tsx        # Control panel card
│
├── themes/
│   ├── types.ts                  # Theme interface
│   ├── playful.ts                # Playground theme
│   ├── premium.ts                # Projects theme
│   └── ThemeProvider.tsx         # Context provider
│
├── layout/
│   ├── DesktopCanvas.tsx         # Infinite pan/zoom canvas
│   ├── MobileScroll.tsx          # Single column scroll
│   └── ResponsiveGrid.tsx        # Switches between desktop/mobile
│
└── UnifiedGrid.tsx               # Main entry point
```

### Code Sharing Strategy

| Shared | Game-Specific | Project-Specific |
|--------|---------------|------------------|
| BaseCard (wrapper) | GameCard content | ProjectCard content |
| useCardQueue | Game data shape | Project data shape |
| useSpawnManager | Best score display | Tech badges, links |
| SearchMenuCard | Game categories | Project categories |
| Theme system | Playful colors | Premium colors |
| Viewport logic | CRT background | Subtle gradient |

---

## File Changes Summary

**New files:**
```
src/components/UnifiedGrid/           # ~10-12 files
src/app/projects/page.tsx             # New page
src/app/projects/[id]/page.tsx        # Optional detail page
```

**Modified files:**
```
src/app/playground/page.tsx           # Replace BentoHub with UnifiedGrid
src/components/Dashboard/DashboardLayout.tsx  # Update navigation
src/components/Header.tsx             # Update Projects link
```

**Deleted files (after migration):**
```
src/components/Playground/BentoHub/   # Entire directory
src/components/InfiniteGrid/          # Entire directory
src/components/Projects/ProjectsModal.tsx
```

---

## Estimated Effort

| Phase | Complexity | Files |
|-------|------------|-------|
| Phase 1: Core | High | 5 |
| Phase 2: Search | Medium | 2 |
| Phase 3: Themes | Low | 3 |
| Phase 4: Mobile | Medium | 3 |
| Phase 5: Pages | Low | 3 |
| Phase 6: Polish | Medium | - |

**Total:** ~15-18 new files, significant refactor

---

## Next Steps

1. Answer remaining open questions (search bar UI, respawn feel, card content)
2. Begin Phase 1 with type definitions and queue system
3. Iterate on each phase with review checkpoints

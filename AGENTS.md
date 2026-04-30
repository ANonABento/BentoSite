# AI Assistant Navigation Guide

Quick reference for AI agents working on this codebase.

## Project Overview

This repo is a Next.js 16 portfolio site for Kevin Jiang with:
- 3D model viewer (Three.js + React Three Fiber)
- Interactive chatbot
- BentoGrid project/playground browsing
- Dark/light theme support
- SEO metadata routes and JSON-LD helpers

## Quick Navigation

### Core Files
| What | File |
|------|------|
| Main landing page | `src/app/page.tsx` |
| Full portfolio (scrollable) | `src/app/scrollable/page.tsx` |
| Global styles & CSS vars | `src/app/globals.css` |
| Color utilities | `src/lib/colors.ts` |

### Component Directories
| Feature | Directory |
|---------|-----------|
| 3D Viewer | `src/components/Dimension/` |
| Chat | `src/components/Chat/` (`src/components/Chat.tsx` re-exports it) |
| BentoGrid | `src/components/BentoGrid/` |
| Playground games | `src/components/Playground/` |
| Projects | `src/components/Projects/` |
| Skills | `src/components/Skills/` |
| Timeline | `src/components/Timeline/` |
| About | `src/components/About/` |
| Header | `src/components/Header.tsx` |

### Design System Files
| Purpose | File |
|---------|------|
| CSS variables (source of truth) | `src/app/globals.css` |
| Design tokens (Dimension) | `src/components/Dimension/ui/shared/design-system.ts` |
| Color utilities | `src/lib/colors.ts` |
| Animation presets | `src/lib/animations.ts` |
| Timing constants | `src/lib/constants.ts` |

---

## Color System

### Primary Colors
- **Purple** (`--purple`): Interactive elements (buttons, links, focus states)
- **Orange** (`--orange`): Highlights, CTAs, attention-grabbing elements

### CSS Variables (source of truth)
```css
/* Dark theme */
--orange: #E07B3C;
--orange-hover: #D4722F;
--orange-active: #C46526;
--orange-muted: rgba(224, 123, 60, 0.2);

--purple: #A78BFA;
--purple-hover: #C4B5FD;
--purple-active: #8B5CF6;
--purple-muted: rgba(167, 139, 250, 0.2);
```

### Usage Rules

**NEVER use hardcoded Tailwind colors:**
```tsx
// BAD - hardcoded Tailwind colors
className="bg-orange-500 text-orange-400"
className="bg-violet-500 hover:bg-violet-400"

// GOOD - CSS variables
className="bg-[var(--orange)] text-[var(--orange)]"
className="bg-[var(--purple)] hover:bg-[var(--purple-hover)]"

// GOOD - CSS utility classes (defined in globals.css)
className="bg-orange text-orange"
className="bg-purple text-purple"
```

### Available CSS Utility Classes
From `globals.css`:
- `.text-orange`, `.text-purple`
- `.bg-orange`, `.bg-orange-muted`
- `.bg-purple`, `.bg-purple-muted`
- `.border-orange`, `.border-purple`
- `.glow-orange`, `.glow-purple`

### For Gradients (use inline styles)
```tsx
// For gradient backgrounds
style={{ background: 'linear-gradient(to right, var(--purple), var(--orange))' }}
```

### Import from colors.ts
```tsx
import { CSS_VARS, COLORS, BUTTON_CLASSES } from '@/lib/colors';

// For inline styles
style={{ color: CSS_VARS.orange }}

// For className
className={COLORS.orange.bg}

// For buttons
className={BUTTON_CLASSES.cta}
```

---

## Code Conventions

### File Organization
- Keep files under 300 lines
- Use barrel exports (`index.ts`)
- Dimension component pattern: `.tsx`, `.types.ts`, `.hooks.ts`, `.config.ts`
- Keep split features organized by responsibility: hooks/state, types, config, views, cards, scene primitives, and UI parts should stay in their feature folders.

### Three.js Components
Always disable SSR:
```tsx
const Component = dynamic(() => import('./Component'), { ssr: false })
```

### Styling Priority
1. CSS utility classes from `globals.css`
2. Design system tokens from `design-system.ts`
3. Tailwind utilities (non-color)
4. Inline styles (last resort, for dynamic values)

### No Hardcoded Values
- Colors: Use CSS variables
- Timing: Use `ANIMATION_DURATIONS` from `src/lib/constants.ts`
- Spacing: Use Tailwind or design system tokens

---

## Common Tasks

### Adding a New Color Variant
1. Add CSS variable to `src/app/globals.css` (both `:root` and `.light`)
2. Add CSS utility class to globals.css
3. Export from `src/lib/colors.ts`
4. Update `design-system.ts` if needed for Dimension component

### Modifying the 3D Viewer
- Main logic: `src/components/Dimension/Dimension.tsx`
- Canvas viewport: `src/components/Dimension/Dimension.viewport.tsx`
- Three.js scene primitives: `src/components/Dimension/scene/`
- Types: `src/components/Dimension/Dimension.types.ts`
- UI widgets: `src/components/Dimension/ui/widgets/`

### Modifying Chat
- Public import path: `@/components/Chat`
- Compatibility entrypoint: `src/components/Chat.tsx`
- Shell and request wiring: `src/components/Chat/Chat.tsx`
- Storage and hydration helpers: `src/components/Chat/chat-storage.ts`
- Presentational pieces: `src/components/Chat/parts/`

### Modifying BentoGrid
- Entry point: `src/components/BentoGrid/BentoGrid.tsx`
- Desktop/mobile views: `src/components/BentoGrid/views/`
- Card pool, camera, and keyboard logic: `src/components/BentoGrid/core/`
- Layout and Matter.js integration: `src/components/BentoGrid/layout/` and `src/components/BentoGrid/physics/`
- Current rebuild handoff: `docs/bentogrid-handoff.md`

### Modifying RhythmGame
- Main shell: `src/components/Playground/RhythmGame/RhythmGame.tsx`
- Audio upload/analysis UI: `src/components/Playground/RhythmGame/AudioUploader.tsx`
- Core hooks/config: `src/components/Playground/RhythmGame/RhythmGame.hooks.ts` and `.config.ts`
- Mode-specific engines: `src/components/Playground/RhythmGame/modes/`

### SEO, Loading, and Accessibility
- Sitemap and robots routes: `src/app/sitemap.ts`, `src/app/robots.ts`
- JSON-LD component and builders: `src/components/seo/`, `src/lib/seo.ts`
- Shared skeletons/fallbacks/transitions: `src/components/ui/`
- Preserve skip-to-content, focus traps, keyboard navigation, ARIA labels, and reduced-motion paths when changing interactive surfaces.

### Adding New Components
1. Create in appropriate `src/components/` subdirectory
2. Use CSS variables for colors
3. Import animation presets from `src/lib/animations.ts`
4. Follow existing patterns in similar components

---

## Commands

```bash
npm run dev      # Dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint check
npm run type-check
npm test
```

---

## Keyboard Shortcuts (3D Viewer)

| Key | Action |
|-----|--------|
| `R` | Reset camera |
| `Space` | Toggle auto-rotation |
| `W` | Toggle wireframe |
| `S` | Screenshot |
| `F` | Fullscreen |
| `C` | Camera presets |
| `Z` | Zoom to fit |
| `?` | Help modal |

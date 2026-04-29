# Kevin Jiang Portfolio

Portfolio site with an interactive 3D viewer, project archive, chatbot, and Playground surfaces.

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.3 | Framework (App Router) |
| React | 19.2.0 | UI library |
| TypeScript | 5.x | Type safety (strict mode enabled) |
| Tailwind CSS | 4.x | Utility-first styling |
| Three.js | 0.181.2 | 3D rendering engine |
| @react-three/fiber | 9.4.0 | React renderer for Three.js |
| @react-three/drei | 10.7.7 | Three.js helper components |

---

## Commands

```bash
npm run dev      # Dev server at localhost:3000
npm run build    # Production build
npm run start    # Run production server
npm run lint     # ESLint check
npm test         # Run unit tests
```

---

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with Geist fonts, metadata, providers, JSON-LD
│   ├── page.tsx            # Main page with boot sequence + dashboard
│   ├── projects/           # BentoGrid-powered portfolio archive route
│   ├── playground/         # BentoGrid-powered games and experiments routes
│   ├── scrollable/         # Long-form portfolio route
│   ├── robots.ts           # Robots metadata route
│   ├── sitemap.ts          # Generated sitemap route
│   └── globals.css         # Tailwind base + CSS variables
│
├── lib/                    # Shared utilities and constants
│   ├── constants.ts        # Centralized constants (breakpoints, timeouts, etc.)
│   ├── utils.ts            # Shared utility functions
│   ├── colors.ts           # Theme color helpers and class maps
│   ├── seo.ts              # Sitemap and JSON-LD builders
│   ├── animations.ts       # Framer Motion animation configs
│   └── __tests__/          # Unit tests for lib functions
│
└── components/
    ├── ui/                 # Shared UI components
    │   ├── Icons.tsx           # 30+ reusable SVG icons
    │   ├── LoadingSpinner.tsx  # Loading states (spinner, overlay, skeleton)
    │   ├── ErrorBoundary.tsx   # Error handling with customizable fallback
    │   ├── Toast.tsx           # Toast notifications
    │   └── index.ts            # Barrel exports
    │
    ├── Chat.tsx            # AI chatbot entrypoint
    ├── Chat/               # Chat storage, hooks, types, and presentation parts
    │
    ├── BentoGrid/          # Shared projects/playground infinite grid
    │   ├── core/               # Camera, viewport, card pool, spawn/navigation hooks
    │   ├── physics/            # Matter.js engine, forces, world binding
    │   ├── search/             # Search card state, UI, and physics helpers
    │   ├── cards/              # Shared card shell and card renderers
    │   └── views/              # Desktop canvas and mobile scroll views
    │
    ├── Dashboard/          # Main dashboard layout
    │   ├── DashboardLayout.tsx # Responsive grid layout
    │   ├── MobileTabs.tsx      # Mobile tab navigation
    │   └── TerminalPanel.tsx   # Terminal-style chat wrapper
    │
    ├── Dimension/          # 3D Model Viewer (modular architecture)
    │   ├── index.ts                # Public viewer barrel
    │   ├── Dimension.tsx           # Main component composition
    │   ├── Dimension.viewport.tsx  # Canvas setup and viewport composition
    │   ├── useDimensionController.ts # Viewer state and controls
    │   ├── Dimension.types.ts      # TypeScript interfaces
    │   ├── Dimension.config.ts     # Model definitions, thresholds
    │   ├── Dimension.hooks.ts      # Custom React hooks
    │   ├── scene/                  # Three.js scene primitives
    │   ├── ui/                     # Viewer controls, feedback, widgets
    │   └── Dimension.utils.ts      # Utilities (re-exports shared utils)
    │
    ├── seo/                # JSON-LD script component
    │
    └── Playground/         # Interactive games collection
        ├── RhythmGame/         # Split rhythm game, audio analysis, Taiko/Mania modes
        ├── design/tokens.ts    # Playground-specific design tokens
        └── shared/             # Shared game components

public/
└── models/
    └── placeholder.stl     # Default 3D model
```

---

## Shared Utilities (`src/lib/`)

### Constants (`constants.ts`)

```typescript
import { BREAKPOINTS, TIMEOUTS, DEFAULTS, PERFORMANCE } from '@/lib/constants';

// Responsive breakpoints (matches Tailwind)
BREAKPOINTS.MD  // 768

// API timeouts
TIMEOUTS.CHAT_REQUEST  // 30000ms

// SSR defaults
DEFAULTS.WINDOW_WIDTH  // 1920

// Performance thresholds
PERFORMANCE.LOW_FPS_THRESHOLD  // 30
```

### Utilities (`utils.ts`)

```typescript
import { generateId, formatFileSize, isMobileDevice, cn } from '@/lib/utils';

// Generate unique IDs
const id = generateId();  // "1709645123456-x7k2m"

// Format file sizes
formatFileSize(1048576);  // "1 MB"

// Device detection
if (isMobileDevice()) { /* ... */ }

// Conditional class names
cn('base', isActive && 'active', isDisabled && 'disabled');
```

### Icons (`components/ui/Icons.tsx`)

```typescript
import { CheckIcon, CopyIcon, SendIcon, SearchIcon } from '@/components/ui/Icons';

<CopyIcon size={16} className="text-gray-400" />
```

### Loading States (`components/ui/LoadingSpinner.tsx`)

```typescript
import { LoadingSpinner, LoadingOverlay, LoadingSkeleton } from '@/components/ui';

<LoadingSpinner size="lg" variant="purple" message="Loading..." />
<LoadingOverlay message="Processing..." />
<LoadingSkeleton width={200} height={20} />
```

---

## Architecture

### Module Pattern

The Dimension component uses a modular file structure:

```
ComponentName.tsx        # Main component
ComponentName.types.ts   # TypeScript interfaces
ComponentName.hooks.ts   # Custom hooks
ComponentName.config.ts  # Constants and configuration
ComponentName.utils.ts   # Utility functions
scene/                   # Three.js primitives and loaders
ui/                      # Feature-local controls, feedback, and widgets
```

**Why**: Keeps concerns separated, files under 300 lines, easy to navigate.

### Custom Hooks (`Dimension.hooks.ts`)

| Hook | Purpose |
|------|---------|
| `useIsMobile()` | Device detection with window resize listener |
| `useScreenSize()` | Tracks window width/height |
| `useKeyboardShortcuts()` | Global keyboard event handling |
| `useModelSearch()` | Filters model list by search query |

### Three.js Components (`scene/`)

| Component | Purpose |
|-----------|---------|
| `ModelWrapper` | Suspense boundary and STL vs GLTF/GLB loader selection |
| `LODModel` | Level-of-detail switching based on FPS |
| `GLTFModel` | GLTF/GLB model rendering and wireframe updates |
| `SceneErrorBoundary` | Model load error classification and fallback rendering |
| `SkeletonLoader` | Suspense fallback scene |
| `ResponsiveOrbitControls` | Camera controls adapted for mobile/desktop |
| `StationaryBackground` | Grid floor and walls environment |
| `BillboardText` | Always-facing-camera text labels |
| `FallbackModel` | Red wireframe cube shown on load failure |
| `SkeletonLoader` | Placeholder while model loads |

### Design System

Shared and feature-local token layers exist:
- **`src/app/globals.css`** - CSS variables and global utility classes
- **`src/lib/colors.ts`** - color helper constants and class maps
- **`src/components/Dimension/ui/shared/design-system.ts`** - Dimension viewer tokens
- **`src/components/Playground/design/tokens.ts`** - Playground-specific tokens

Use CSS variables and color helpers when possible:
```typescript
import { CSS_VARS, COLORS, BUTTON_CLASSES } from '@/lib/colors';
```

### Mobile Optimization

| Optimization | Desktop | Mobile |
|--------------|---------|--------|
| Shadows | Enabled (PCFSoftShadowMap) | Disabled |
| Pixel ratio | Native | Capped at 1.5x |
| LOD | Higher detail | Lower detail |
| Lighting | Full intensity | Reduced |
| Controls | Mouse orbit | Touch gestures |
| Zoom range | 3-30 | 4-40 |

---

## Code Conventions

### TypeScript
- Strict mode enabled (`"strict": true` in tsconfig)
- All props/state must have explicit types
- Prefer interfaces over type aliases for component props

### Dynamic Imports for WebGL
All Three.js components must disable SSR to prevent hydration errors:

```tsx
const Dimension = dynamic(() => import('@/components/Dimension'), {
  ssr: false,
  loading: () => <LoadingSpinner />
})
```

### Styling
- Prefer CSS utility classes from `src/app/globals.css`
- Use feature or color token modules for shared variants
- Use Tailwind utilities for non-color layout and spacing
- Avoid inline style objects unless the value is genuinely dynamic

### Component Organization
- Extract complex logic into custom hooks
- Keep files under 300 lines
- Use barrel exports (`index.ts`) for clean imports
- One responsibility per file

### Shared Code
- Use utilities from `@/lib/utils` instead of duplicating
- Use constants from `@/lib/constants`
- Use icons from `@/components/ui/Icons`

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `R` | Reset camera to default position |
| `Space` | Toggle auto-rotation |
| `W` | Toggle wireframe mode |
| `S` | Take screenshot (downloads PNG) |
| `F` | Toggle fullscreen |
| `Z` | Zoom to fit model |
| `C` | Show camera presets |
| `?` | Show keyboard shortcuts help |

---

## Critical Gotchas

### 1. SSR Must Be Disabled for 3D
Three.js components cause hydration errors if server-rendered. Always use `ssr: false`:
```tsx
dynamic(() => import('./Component'), { ssr: false })
```

### 2. Model Files Location
STL and GLTF/GLB models are served from `/public/models/`. The path in config should be `/models/filename.stl` or `/models/filename.glb` (no `/public` prefix).

### 3. Mobile Detection Affects Rendering
The `isMobile` flag changes:
- Shadow rendering (disabled on mobile)
- LOD thresholds (more aggressive on mobile)
- Pixel ratio (capped at 1.5x)
- Control sensitivity

Always test changes on both desktop and mobile.

### 4. Use Shared Utilities
Don't duplicate code. Import from shared modules:
```tsx
// Good
import { generateId, formatFileSize } from '@/lib/utils';
import { TIMEOUTS } from '@/lib/constants';
import { CopyIcon } from '@/components/ui/Icons';

// Bad
const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
```

### 5. Model Config Schema
When adding new models to `Dimension.config.ts`:
```typescript
{
  id: string,           // Unique identifier
  name: string,         // Display name
  path: string,         // Path to .stl/.gltf/.glb file (e.g., '/models/model.glb')
  thumbnail: string,    // Preview image path
  fileSize: number,     // In bytes
  dimensions: { width: number, height: number, depth: number },
  vertexCount: number,
  description: string,
  category: string      // For filtering in model selector
}
```

---

## Key Files Reference

| What | File |
|------|------|
| Main page | `src/app/page.tsx` |
| Shared constants | `src/lib/constants.ts` |
| Shared utilities | `src/lib/utils.ts` |
| Color helpers | `src/lib/colors.ts` |
| SEO helpers | `src/lib/seo.ts` |
| Icon library | `src/components/ui/Icons.tsx` |
| Loading components | `src/components/ui/LoadingSpinner.tsx` |
| Error boundary | `src/components/ui/ErrorBoundary.tsx` |
| 3D viewer entry | `src/components/Dimension/Dimension.tsx` |
| Chatbot | `src/components/Chat.tsx` |
| Global styles | `src/app/globals.css` |

---

## Testing

Tests are in `src/lib/__tests__/` using Vitest:

```bash
npm test           # Run all tests
npm test -- --run  # Run once without watch
```

Current test coverage:
- `constants.test.ts` - 29 tests for all constants
- `utils.test.ts` - 44 tests for utility functions
- `colors.test.ts` - 11 tests for color utilities
- `animations.test.ts` - 29 tests for animation configs

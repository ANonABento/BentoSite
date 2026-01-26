# Mumbai-V2 Portfolio

Portfolio website with interactive 3D model viewer and chatbot interface.

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
```

---

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with Geist fonts, metadata
│   ├── page.tsx            # Main page: 50/50 split Dimension + Chat
│   └── globals.css         # Tailwind base + CSS variables (dark theme)
│
└── components/
    ├── Chat.tsx            # Simple chatbot with hardcoded responses
    │
    └── Dimension/          # 3D Model Viewer (modular architecture)
        ├── Dimension.tsx           # Main component, state management
        ├── Dimension.types.ts      # TypeScript interfaces (10+ types)
        ├── Dimension.config.ts     # Constants, model definitions, thresholds
        ├── Dimension.hooks.ts      # 9 custom React hooks
        ├── Dimension.3d.tsx        # Three.js scene components
        ├── Dimension.utils.ts      # Utility functions
        ├── Dimension.ui.tsx        # UI component exports
        │
        └── ui/
            ├── components.tsx      # Legacy re-exports
            ├── widgets/
            │   ├── control-panel.tsx           # Main control interface
            │   ├── camera-presets-widget.tsx   # Camera angle presets
            │   ├── model-info-display.tsx      # Model metadata display
            │   └── collapsible-widget.tsx      # Reusable collapsible
            ├── modals/
            │   ├── model-selector.tsx          # Model selection modal
            │   └── keyboard-shortcuts-help.tsx # Help modal
            ├── feedback/
            │   ├── loading-spinner.tsx         # Loading animation
            │   ├── loading-progress.tsx        # Progress bar
            │   └── error-message.tsx           # Error display
            └── shared/
                ├── design-system.ts            # Design tokens
                └── index.ts                    # Barrel exports

public/
└── models/
    └── placeholder.stl     # Default 3D model
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
ComponentName.3d.tsx     # Three.js specific components
```

**Why**: Keeps concerns separated, files under 300 lines, easy to navigate.

### Custom Hooks (`Dimension.hooks.ts`)

| Hook | Purpose |
|------|---------|
| `useIsMobile()` | Device detection with window resize listener |
| `useScreenSize()` | Tracks window width/height |
| `usePerformanceMonitor()` | FPS monitoring for adaptive quality |
| `useKeyboardShortcuts()` | Global keyboard event handling |
| `useTouchGestures()` | Pinch-to-zoom, two-finger pan |
| `useKeyboardHelp()` | Toggles keyboard shortcuts help modal |
| `usePerformanceHUD()` | Toggles FPS display overlay |
| `useModelSearch()` | Filters model list by search query |

### Three.js Components (`Dimension.3d.tsx`)

| Component | Purpose |
|-----------|---------|
| `STLModelWrapper` | Loads STL files with error handling and retry |
| `LODModel` | Level-of-detail switching based on FPS |
| `ResponsiveOrbitControls` | Camera controls adapted for mobile/desktop |
| `StationaryBackground` | Grid floor and walls environment |
| `BillboardText` | Always-facing-camera text labels |
| `FallbackModel` | Red wireframe cube shown on load failure |
| `SkeletonLoader` | Placeholder while model loads |

### Design System (`ui/shared/design-system.ts`)

Centralized tokens for consistency:
- **Colors**: gray-900, blue-600, etc.
- **Spacing**: xs (4px), sm (8px), md (16px), lg (24px)
- **Animation**: fast (150ms), normal (200ms), slow (300ms)
- **Patterns**: Button styles, card styles, interactive states

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
const Dimension = dynamic(() => import('@/components/Dimension/Dimension'), {
  ssr: false,
  loading: () => <LoadingSpinner />
})
```

### Styling
- Use Tailwind utilities as primary approach
- Use design system tokens from `design-system.ts`
- Avoid inline style objects unless dynamic
- CSS variables defined in `globals.css`

### Component Organization
- Extract complex logic into custom hooks
- Keep files under 300 lines
- Use barrel exports (`index.ts`) for clean imports
- One responsibility per file

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
STL models are served from `/public/models/`. The path in config should be `/models/filename.stl` (no `/public` prefix).

### 3. Mobile Detection Affects Rendering
The `isMobile` flag changes:
- Shadow rendering (disabled on mobile)
- LOD thresholds (more aggressive on mobile)
- Pixel ratio (capped at 1.5x)
- Control sensitivity

Always test changes on both desktop and mobile.

### 4. Design Tokens Required
Don't hardcode colors or spacing. Import from design system:
```tsx
import { colors, spacing } from './ui/shared/design-system'
```

### 5. Model Config Schema
When adding new models to `Dimension.config.ts`:
```typescript
{
  id: string,           // Unique identifier
  name: string,         // Display name
  path: string,         // Path to .stl file (e.g., '/models/model.stl')
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
| 3D viewer entry | `src/components/Dimension/Dimension.tsx` |
| Three.js components | `src/components/Dimension/Dimension.3d.tsx` |
| Type definitions | `src/components/Dimension/Dimension.types.ts` |
| Model configs | `src/components/Dimension/Dimension.config.ts` |
| Custom hooks | `src/components/Dimension/Dimension.hooks.ts` |
| Design tokens | `src/components/Dimension/ui/shared/design-system.ts` |
| Control panel | `src/components/Dimension/ui/widgets/control-panel.tsx` |
| Global styles | `src/app/globals.css` |
| Enhancement roadmap | `plan.md` |

---

## Enhancement Roadmap

See `plan.md` for the 3-phase enhancement plan:
- **Phase 1**: Core QoL & UI (loading states, error handling, controls)
- **Phase 2**: Enhanced Interactivity (annotations, animations, effects)
- **Phase 3**: Advanced Features (multi-format, AR/VR, analytics)

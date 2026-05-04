# bentOS — Kevin Jiang Portfolio

Portfolio site branded as "bentOS". Surfaces:
- `/` — boot splash + dashboard (3D viewer + chat + skills)
- `/projects` — BentoGrid project archive (Matter.js physics canvas)
- `/playground` — BentoGrid games and experiments
- `/scrollable` — long-form portfolio with hero, skills, timeline, chat
- `/photography` — image gallery

For diagrams (route tree, subsystems, BentoGrid card hierarchy) see [`docs/architecture.md`](docs/architecture.md).

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.3 | Framework (App Router) |
| React | 19.2.0 | UI library |
| TypeScript | 5.x | Type safety (strict mode) |
| Tailwind CSS | 4.x | Utility-first styling |
| Three.js | 0.181.2 | 3D rendering |
| @react-three/fiber | 9.4.0 | React renderer for Three.js |
| @react-three/drei | 10.7.7 | Three.js helpers |
| @react-three/postprocessing | 3.x | Postprocessing effects |
| matter-js | 0.20 | 2D physics for BentoGrid |
| framer-motion | 12.x | Animation primitives (use `LazyMotion` + `domAnimation`) |
| @vercel/analytics + speed-insights | — | Telemetry |

---

## Commands

```bash
npm run dev           # Dev server at localhost:3000
npm run build         # Production build
npm run start         # Production server
npm run lint          # ESLint
npm run type-check    # tsc --noEmit
npm test              # Vitest run
npm run test:watch    # Vitest watch
npm run e2e           # Playwright E2E
npm run analyze       # Bundle analyzer (ANALYZE=true)
npm run lighthouse    # Lighthouse CI locally
npm run size          # Bundle size budget check
```

CI (`.github/workflows/ci.yml`) runs lint + type-check + unit tests + build + Lighthouse + bundle-size on every PR (Gate 4.2 / 4.4 — perf and quality gates).

---

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx          # Root: ThemeProvider, ToastProvider, PageTransition,
│   │                       #       AnimatedCursor, theme flash-prevent script
│   ├── page.tsx            # Boot splash gate + DashboardLayout
│   ├── HomeClient.tsx
│   ├── globals.css         # Imports styles/{theme,utilities,animations,content}.css
│   ├── styles/             # Theme tokens, utilities, animations, prose
│   ├── projects/           # BentoGrid-backed project archive
│   ├── playground/         # BentoGrid-backed games hub + per-game routes
│   ├── scrollable/         # Long-form portfolio (hero, chat, skills, footer)
│   ├── photography/        # Image gallery
│   ├── api/                # /api/chat (Gemini) + /api/feedback
│   ├── opengraph-image.tsx # Auto-generated OG image
│   ├── twitter-image.tsx   # Auto-generated Twitter card
│   ├── robots.ts           # robots.txt
│   ├── sitemap.ts          # sitemap.xml (uses lib/seo.ts)
│   └── 404 / not-found.tsx # 404 surfaces
│
├── lib/
│   ├── constants.ts        # BREAKPOINTS, TIMEOUTS, ANIMATION_DURATIONS,
│   │                       # DEFAULTS, PERFORMANCE, ZOOM_LIMITS, STORAGE_KEYS,
│   │                       # Z_INDEX, API_ENDPOINTS, RESUME_URL
│   ├── utils.ts            # generateId, formatFileSize, isMobileDevice, cn, …
│   ├── colors.ts           # CSS_VARS / COLORS / GRADIENTS / BUTTON_CLASSES
│   ├── seo.ts              # ROUTE_SEO/GAME_SEO, sitemap + JSON-LD builders
│   ├── animations.ts       # Framer Motion variant configs
│   ├── boot-session.ts     # Session-scoped boot splash gate
│   ├── theme-context.tsx   # Light/dark theme provider (T1)
│   ├── analytics.ts        # Wrappers around Vercel analytics
│   ├── clipboard.ts        # Copy-to-clipboard helper
│   ├── image-utils.ts      # Blur placeholder helpers
│   ├── portfolio-context.ts# Static portfolio data for chat/dashboard
│   ├── projects-data.ts    # Project list
│   ├── map-data.ts         # Location data for the globe viewer
│   ├── site-config.ts      # SEO/site metadata (`bentOS`, social links)
│   ├── use-debug-flag.ts   # Debug HUD gate (dev OR ?debug=1, SSR-safe)
│   ├── use-focus-trap.ts   # Focus trap hook for modals
│   ├── use-has-mounted.ts  # SSR-safe mount detection
│   └── __tests__/          # Vitest specs (constants, utils, colors,
│                           # animations, seo, seo-validator, boot-session,
│                           # clipboard, image-utils, use-focus-trap)
│
├── components/
│   ├── ui/                 # Shared primitives
│   │   ├── Icons.tsx           # 30+ inline SVG icons
│   │   ├── LoadingSpinner.tsx  # spinner / overlay / skeleton
│   │   ├── ErrorBoundary.tsx   # Error boundary with fallback
│   │   ├── Skeleton.tsx        # Content skeleton
│   │   ├── Toast.tsx           # Toast provider + hook
│   │   ├── PageTransition.tsx  # Route fade
│   │   ├── ScrollReveal.tsx    # Reveal-on-scroll
│   │   ├── KeyboardShortcutsHelp.tsx
│   │   ├── LazyPanelFallback.tsx
│   │   ├── RouteLoadingFallback.tsx
│   │   ├── SectionHeader.tsx
│   │   └── index.ts            # Barrel
│   │
│   ├── cursor/             # AnimatedCursor (trail + magnetic)
│   │   ├── AnimatedCursor.tsx  # rAF lerp tracker, prefers-reduced-motion + coarse-pointer aware
│   │   ├── cursor-routes.ts    # Routes where the custom cursor renders
│   │   ├── cursor-styles.ts    # Style injection helper
│   │   └── index.ts
│   │
│   ├── BentoOS/            # Boot splash (T3)
│   │   ├── BootScreen.tsx
│   │   ├── BentoIcon.tsx
│   │   ├── TerminalPrompt.tsx
│   │   └── useBootSequence.ts  # Phases, glitch offsets, auto-advance, multi-input dismiss
│   │
│   ├── Header.tsx / Header.parts.tsx  # Site header w/ Resume button + theme toggle
│   │
│   ├── Chat.tsx                       # Public chat barrel
│   ├── Chat/                          # Chat hooks, types, storage, parts
│   │   ├── Chat.tsx, Chat.hooks.ts, chat.types.ts, chat-storage.ts
│   │   └── parts/                     # Presentation pieces
│   │
│   ├── Dashboard/                     # Main page layout
│   │   ├── DashboardLayout.tsx        # Responsive 3D + chat + skills grid
│   │   ├── ViewfinderPanel.tsx
│   │   ├── TerminalPanel.tsx          # Chat wrapped in terminal chrome
│   │   ├── MobileTabs.tsx             # Mobile tab switcher
│   │   └── index.ts
│   │
│   ├── BentoGrid/                     # Shared infinite grid (projects + playground)
│   │   ├── BentoGrid.tsx              # Top-level desktop/mobile router
│   │   ├── BentoGrid.constants.ts     # Themes, breakpoints, IDs
│   │   ├── BentoGrid.types.ts         # Card data + view types
│   │   ├── debugSeed.ts               # ?seed=1 / ?debug=queue dev seeding
│   │   ├── core/                      # Camera, viewport, card pool, spawn,
│   │   │                              # navigation, board controller, keyboard
│   │   ├── physics/                   # Matter.js engine, forces, world binding
│   │   ├── layout/                    # Grid occupancy, exclusions, sizes, positions
│   │   ├── cards/                     # BaseCard + ProjectCard / GameCard /
│   │   │                              # InfoMenuCard / SearchMenuCard / DefaultCard
│   │   ├── views/                     # DesktopCanvasView / MobileScrollView
│   │   └── __tests__/                 # Vitest specs
│   │
│   ├── Dimension/                     # 3D model viewer (modular)
│   │   ├── Dimension.tsx              # Composition root
│   │   ├── Dimension.viewport.tsx     # Canvas + lighting
│   │   ├── Dimension.config.ts        # Models, camera, perf
│   │   ├── Dimension.types.ts         # Interfaces
│   │   ├── Dimension.hooks.ts         # useIsMobile, useScreenSize, …
│   │   ├── Dimension.utils.ts         # Shared helpers
│   │   ├── useDimensionController.ts  # Controller state machine
│   │   ├── scene/                     # Three.js primitives
│   │   ├── ui/                        # Controls, feedback, widgets, modals
│   │   └── index.ts
│   │
│   ├── Viewfinder/                    # Multi-format media panel
│   │   ├── Viewfinder.tsx             # Tabs + dynamic-imported viewers
│   │   ├── ViewerSkeleton.tsx
│   │   ├── ViewfinderHeader.tsx
│   │   └── viewers/                   # Model3D / Image / PDF / Website /
│   │                                  # Video / Game / Map (with globe)
│   │
│   ├── Playground/                    # Game implementations (lazy)
│   │   ├── BentoHub/                  # /playground hub data
│   │   ├── RhythmGame/, AimTrainer/, Game2048/, Minesweeper/, Pacman/,
│   │   ├── ReactionGame/, SortingVisualizer/, Soundboard/, TypingGame/,
│   │   ├── design/tokens.ts           # Playground-only design tokens
│   │   └── shared/                    # Shared game UI
│   │
│   ├── Projects/                      # Featured projects + project theme + tech badges
│   ├── About/, Skills/, Timeline/     # Scrollable section components
│   ├── seo/JsonLd.tsx                 # Inline JSON-LD <script>
│   └── ui/                            # See above
│
└── content/                # Static portfolio content (portfolio.json)

public/
├── models/
│   └── placeholder.stl     # Sample STL (the default model is procedural — no file)
└── photos/, og-image.png, …
```

---

## Subsystems

### Boot splash (`components/BentoOS`, T3)

- `BootScreen` is gated by `lib/boot-session.ts`: shown once per session and skipped on dashboard deep-links.
- `useBootSequence` drives phases (logo → bar → flash) with auto-advance and multi-input dismiss (key / click / touch).
- Hard reloads (detected via `performance.getEntriesByType('navigation')`) replay the boot.
- Session flag: `sessionStorage['bentOS.bootComplete']`.

### Theme system (`lib/theme-context.tsx`, `app/styles/theme.css`, T1 + T5)

- Two semantic accent tracks:
  - **`--primary`** (orange) — generic CTA / interactive / focus.
  - **`--ai`** (purple) — reserved for AI-facing UI (chat, AI buttons).
- Helpers in `lib/colors.ts`: `CSS_VARS`, `COLORS`, `GRADIENTS`, `BUTTON_CLASSES`.
- `app/layout.tsx` ships an inline pre-hydration script that adds the saved theme class before paint to avoid a flash.
- BentoGrid card backgrounds + playground tokens read from CSS variables so they re-flow with the toggle (T1 grid theme parity).

### BentoGrid (`components/BentoGrid`)

A shared infinite grid backing `/projects` and `/playground`:

- **Desktop** (`views/DesktopCanvasView.tsx`): pannable canvas, FIFO card pool, Matter.js settling forces, sticky info card morph (free → edge bar → icon strip).
- **Mobile** (`views/MobileScrollView.tsx`): vertical scroll fallback; same card components render in flow.
- **Cards** (`cards/`): all share `BaseCard` (motion shell + optional anchor wrapper). Renderers: `ProjectCard`, `GameCard`, `SearchMenuCard`, `InfoMenuCard`, `DefaultCard`.
- **Layout** (`layout/`): grid occupancy + size + exclusion + position planning.
- **Physics** (`physics/`): Matter.js engine wired via `usePhysicsWorld`, with `forces.ts` for repulsion / settling.
- **Debug seeding**: `?seed=1` or `?debug=queue` swaps in synthetic 80-card data via `debugSeed.ts`.
- **Debug HUD** in `DesktopCanvasView` is gated by `useDebugFlag()` (`lib/use-debug-flag.ts`) — visible in development OR when the URL has `?debug=1`. Production visitors without the flag never see the camera/visible/queue overlay.

### 3D viewer (`components/Dimension`)

- Modular split: `Dimension.tsx` composes `Dimension.viewport.tsx` (Canvas + lighting), the controller hook, scene primitives, and UI overlays.
- Loaders dispatched in `scene/ModelWrapper.tsx` by `format`: `procedural` (default cat from primitives), `stl`, or `gltf`/`glb`.
- Default model is a **procedural cat** (`scene/ProceduralCat.tsx`) — no external asset, no network fetch. `Dimension.config.ts` exports `PROCEDURAL_CAT_PATH` as the sentinel for `DEFAULT_MODEL_PATH`.
- LOD switching (`scene/LODModel.tsx`) reacts to FPS via `PERFORMANCE.LOW_FPS_THRESHOLD`.
- Mobile tweaks: shadows off, pixel ratio capped at `1.5`, lower LOD thresholds, broader zoom range (see table below).

### Animated cursor (`components/cursor`)

- `AnimatedCursor` mounts in `app/layout.tsx`. Active routes: `/`, `/projects`, `/playground` (see `cursor-routes.ts`).
- Effects: smooth lerp follow + 4-dot trail + magnetic pull toward `[data-magnetic]` elements (cards opt in via `BaseCard` `magnetic` prop).
- Disabled on coarse pointers (`pointer: coarse`) and `prefers-reduced-motion: reduce`. Native cursor is never hidden, so JS failure degrades to default.

### Chat (`components/Chat`, `app/api/chat`)

- `Chat.tsx` exposes `ChatFunctions` ({send, clear, focusInput}) up to the dashboard via `onReady`.
- Storage in `chat-storage.ts` (sessionStorage, capped by `DEFAULTS.MAX_CHAT_MESSAGES`).
- Header label is "Assistant" (the floating panel was renamed from "Servant").
- Resume CTAs across the site read from `RESUME_URL` in `lib/constants.ts` (canonical Google Doc PDF export). Add new resume entry points by importing that constant — don't hard-code the URL.

### SEO (`lib/seo.ts`, `components/seo/JsonLd.tsx`, SEO 3.2 / 3.4)

- `ROUTE_SEO` / `GAME_SEO` constants drive `createRouteMetadata()` for per-route `<title>` + description.
- All routes brand with `bentOS` (template `%s | bentOS`).
- `lib/seo.ts` builds JSON-LD (Person, WebSite, Portfolio, project ItemLists, photography ImageObject sets, BreadcrumbList).
- `lib/__tests__/seo-validator.test.ts` is the CI gate that asserts every registered route has consistent metadata + JSON-LD.

### Performance (Perf 2.1b / 2.2b)

- All heavy panels (`Viewfinder`, `Chat`, `SkillsSection`, individual viewers, individual playground games) are loaded with `next/dynamic` + `ssr: false` and a `LazyPanelFallback` / `ViewerSkeleton`.
- Bundle budget enforced by `scripts/check-bundle-size.mjs` (size-limit) on PRs.
- Lighthouse CI runs against the built artifacts; budget config in `lighthouserc.js`.
- Use `framer-motion`'s `LazyMotion` + `domAnimation` (already at the page root) to avoid pulling the full motion bundle.

---

## Code Conventions

### TypeScript
- `"strict": true`. Always type props/state.
- Prefer `interface` for component props; `type` for unions/aliases.

### Styling
- Use CSS variables (`var(--primary)`, `var(--ai)`, …) and the helpers in `lib/colors.ts`.
- Use Tailwind utilities for layout/spacing only — colors must go through tokens.
- **Never** hard-code hex or `bg-orange-500` / `bg-violet-500` style classes.

### Components
- Keep files under ~300 lines; split into `*.types.ts`, `*.hooks.ts`, `*.config.ts`, `*.utils.ts` when they grow.
- Extract complex callbacks out of JSX (avoid inline arrows that recreate per render).
- One responsibility per file. Use barrel `index.ts` for public surfaces.

### Shared utilities (DRY)
```tsx
// Prefer
import { generateId, isMobileDevice, cn } from '@/lib/utils';
import { TIMEOUTS, BREAKPOINTS } from '@/lib/constants';
import { CSS_VARS, BUTTON_CLASSES } from '@/lib/colors';
import { CopyIcon } from '@/components/ui/Icons';
```

### Dynamic imports for WebGL / heavy panels
```tsx
const Dimension = dynamic(() => import('@/components/Dimension'), {
  ssr: false,
  loading: () => <ViewerSkeleton />,
});
```

### Tests
Tests live in `src/lib/__tests__` and component-local `__tests__/`. Run with Vitest.

```bash
npm test           # one-shot
npm run test:watch # watch mode
```

---

## Common pitfalls

These are recurring traps from recent T1–T7 work — read before changing the relevant file.

1. **Cards use `<a href>`, not `<button>` (T4).**
   `BaseCard` wraps the shell in a real anchor when `href` is provided so middle-click, copy-link, and right-click behave natively. Don't replace it with a button + `router.push()`.

2. **Color tokens, not raw hex (T5).**
   Search before introducing a new color: `rg "var\(--primary" src/`. Use `CSS_VARS` / `COLORS` / `BUTTON_CLASSES` from `lib/colors.ts`. The amber palette has been removed — don't reintroduce `text-amber-*` / `bg-amber-*`.

3. **Purple is reserved for AI UI.**
   `--ai` (purple) is for chat, AI controls, and `addAssistant` paths. Generic CTAs use `--primary` (orange). Don't use purple for "premium" decoration on non-AI surfaces.

4. **Chat persona is "Assistant".**
   The floating chat header on `/scrollable` and the chat hook (`addAssistantMessage` / `addAssistant`) all read "Assistant". Don't reintroduce the older "Servant" label.

5. **Resume CTAs share one URL via `RESUME_URL`.**
   Header, dashboard, scrollable hero, and scrollable page all import `RESUME_URL` from `lib/constants.ts`. Don't hard-code `/resume.pdf` or any other path — change the constant once and every CTA follows.

6. **Default 3D model is procedural, not an asset file.**
   `Dimension.config.ts` ships a procedural cat (`scene/ProceduralCat.tsx`) wired through `ModelWrapper` via `format: 'procedural'`. Keep the default fully self-contained (no network fetch, no licensed mesh); don't swap in an external `.glb`/`.stl` as the default.

7. **Debug HUD must be gated by `useDebugFlag()`.**
   The `Camera / Visible / Queue` overlay in `DesktopCanvasView` is hidden unless `useDebugFlag()` returns true (development build OR `?debug=1` in the URL). New ambient overlays should reuse the same hook — never paint raw camera/state for production visitors.

8. **Boot splash is session-scoped.**
   Don't trigger `BootScreen` from inside dashboard navigation — `lib/boot-session.ts` is the source of truth. Hard reloads replay; soft navigation does not.

9. **3D components must `ssr: false`.**
   Three.js components hydrate-mismatch under SSR. Always wrap with `dynamic(() => import(...), { ssr: false })`.

10. **Model file paths are public-rooted.**
    Use `/models/foo.glb`, not `/public/models/foo.glb`.

11. **Mobile detection changes rendering, not just layout.**
    Shadows, pixel ratio, LOD thresholds, and zoom range all branch on `isMobile`. Manually verify both viewports when changing the viewer.

12. **Cursor opt-in via `magnetic` prop.**
    Magnetic hover targets only register when an element has `[data-magnetic]`. Cards expose this via `BaseCard`'s `magnetic` prop — don't sprinkle the attribute by hand.

13. **No AI attribution in commits.**
    Commit messages do not include "Generated with Claude Code", co-authored-by trailers, or robot emojis.

---

## Mobile Optimization

| Optimization | Desktop | Mobile |
|--------------|---------|--------|
| Shadows | PCFSoftShadowMap | Disabled |
| Pixel ratio | Native | ≤ 1.5× |
| LOD | Higher detail | Lower detail |
| Lighting | Full intensity | Reduced |
| Controls | Mouse orbit | Touch gestures |
| Zoom range | 3–30 | 4–40 |
| BentoGrid | Pannable canvas | Vertical scroll |
| Animated cursor | Active | Disabled (coarse pointer) |

---

## Keyboard Shortcuts

3D viewer (Dimension):

| Key | Action |
|-----|--------|
| `R` | Reset camera |
| `Space` | Toggle auto-rotation |
| `W` | Toggle wireframe |
| `S` | Screenshot (PNG download) |
| `F` | Toggle fullscreen |
| `Z` | Zoom to fit |
| `C` | Camera presets |
| `?` | Shortcuts help modal |

BentoGrid (`/projects`, `/playground`):

| Key | Action |
|-----|--------|
| `WASD` / arrow keys | Pan camera |
| Click card | Open project / game |
| `R` | Reset view |

---

## Key Files Reference

| What | File |
|------|------|
| Root layout (cursor, theme, toast) | `src/app/layout.tsx` |
| Boot + dashboard entry | `src/app/page.tsx` |
| Boot session gate | `src/lib/boot-session.ts` |
| Boot UI | `src/components/BentoOS/BootScreen.tsx` |
| Animated cursor | `src/components/cursor/AnimatedCursor.tsx` |
| Theme tokens (CSS) | `src/app/styles/theme.css` |
| Theme provider | `src/lib/theme-context.tsx` |
| Color helpers | `src/lib/colors.ts` |
| Shared constants | `src/lib/constants.ts` |
| Shared utilities | `src/lib/utils.ts` |
| SEO + JSON-LD | `src/lib/seo.ts` |
| Sitemap / robots | `src/app/sitemap.ts`, `src/app/robots.ts` |
| BentoGrid root | `src/components/BentoGrid/BentoGrid.tsx` |
| BentoGrid card shell | `src/components/BentoGrid/cards/BaseCard.tsx` |
| Info card refactor | `src/components/BentoGrid/cards/InfoMenuCard.tsx` |
| 3D viewer entry | `src/components/Dimension/Dimension.tsx` |
| Viewfinder (media tabs) | `src/components/Viewfinder/Viewfinder.tsx` |
| Chat | `src/components/Chat/Chat.tsx` |
| Dashboard | `src/components/Dashboard/DashboardLayout.tsx` |
| Bundle size script | `scripts/check-bundle-size.mjs` |
| Lighthouse config | `lighthouserc.js` |
| CI workflows | `.github/workflows/ci.yml` |

---

## Testing

Vitest specs in `src/lib/__tests__/` and component-local `__tests__/`:

- `constants.test.ts`, `utils.test.ts`, `colors.test.ts`, `animations.test.ts`
- `seo.test.ts` + `seo-validator.test.ts` (Gate 4.4 — every registered route has consistent metadata + JSON-LD)
- `boot-session.test.ts`, `clipboard.test.tsx`, `image-utils.test.ts`, `use-focus-trap.test.tsx`
- `BentoGrid/__tests__/`, `BentoGrid/cards/cards.test.tsx`
- `ui/PageTransition.test.tsx`, `ui/ScrollReveal.test.tsx`, `ui/ErrorBoundary.test.tsx`
- `components/seo/JsonLd.test.tsx`
- Playwright E2E in `tests/`

```bash
npm test                  # vitest run
npm run e2e               # Playwright
npm run lighthouse        # Local Lighthouse CI
```

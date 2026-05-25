# bentOS Optimization Plan

Synthesized from four parallel audits (bundle/deps, 3D+physics, React renders, images/fonts/CSS/animations) plus a webpack analyzer build. Scope confirmed with user: **broad sweep, dep swaps OK when clear win, perf-first with a11y/SEO noted in passing.**

## Baselining (do first, before any change)

Establish numbers we can regress against:

```bash
npm run build && npm run size            # current First-Load JS gzip total
ANALYZE=true npx next build --webpack    # full chunk report at .next/analyze/client.html
                                         # NOTE: default Turbopack build is incompatible
                                         # with @next/bundle-analyzer — use --webpack.
npm run lighthouse                       # Perf / LCP / TBT / CLS baseline (./.lighthouseci/)
```

Capture each number into the PR description so reviewers see the delta. The bundle analyzer html is already at `.next/analyze/client.html` (773 KB) from this audit run.

## Phase 1 — zero-risk wins (fast, no behavior change)

Each item independently shippable. Aim to land as one PR or a tight series.

### 1.1 Drop three unused dependencies
- `@react-three/postprocessing` (3.0.4)
- `postprocessing` (6.38.2)
- `yet-another-react-lightbox` (3.28.0) — `src/app/photography/_components/PhotographyGallery.tsx` has its own CSS lightbox.

`npm uninstall` the three, verify `npm run build`, `npm test`, `npm run e2e` are green.
Estimated win: ~50 KB gzip off the lockfile / supply chain; some are likely already tree-shaken out of the runtime bundle but the dep weight in installs/CI is real.

### 1.2 Enable React 19 Compiler
- Add `experimental: { reactCompiler: true }` to `next.config.ts`.
- Install `babel-plugin-react-compiler` (Next still needs it even with Turbopack in some configurations — verify after install).
- Auto-memoizes ~121 client components. Biggest single lever for BentoGrid card render cost.
- Validate: `npm test`, `npm run e2e`, click through /, /projects, /playground.
- Expected: 5–8% bundle change, BentoGrid frame stability on >50 cards.

### 1.3 Memoize ThemeContext value — `src/lib/theme-context.tsx:87`
Wrap `value` in `useMemo`; wrap `setTheme` in `useCallback`. Stops every consumer from re-rendering when an unrelated parent renders.

### 1.4 Switch heavy `motion.*` imports to lightweight `m.*`
LazyMotion + domAnimation is correctly mounted at `src/app/page.tsx:96`, `src/app/HomeClient.tsx`, `src/app/scrollable/page.tsx:125`. But these components import `motion` (full features) instead of `m` (lazy features):

- `src/components/BentoOS/BootScreen.tsx:3`
- `src/components/BentoOS/TerminalPrompt.tsx:4`
- `src/components/Dashboard/DashboardLayout.tsx:5`
- `src/app/playground/rhythm/page.tsx:4` (route is dynamic but verify)
- `src/components/Playground/AimTrainer/AimTrainer.tsx:3`
- `src/components/Playground/SortingVisualizer/SortingVisualizer.tsx:3`
- `src/components/Playground/Pacman/Pacman.tsx:3`
- `src/components/Playground/TypingGame/TypingGame.tsx:3`
- `src/components/Playground/Game2048/Tile.tsx:3`
- `src/components/Playground/RhythmGame/{RhythmGame,HitCircle,AudioUploader}.tsx`
- `src/components/Playground/RhythmGame/modes/{ManiaGame,TaikoGame}.tsx`

Search/replace `motion.` → `m.` and `from 'framer-motion'` import to `m`. Playground games are dynamic-imported, so the per-page bundle benefit is contained — but home/dashboard ones are eager.

### 1.5 `frameloop="demand"` on idle 3D canvases
- `src/components/Dimension/Dimension.viewport.tsx:187` — add `frameloop="demand"`. When `autoRotate=false` and user not dragging, stop driving frames. Call `invalidate()` from auto-rotate toggle, model swap, and pointer events.
- `src/components/Viewfinder/viewers/MapViewer.tsx:329` — same. Globe `autoRotate` will keep it on demand only while rotating.

### 1.6 Respect `prefers-reduced-motion` for 3D auto-rotate
- `src/components/Dimension/useDimensionController.ts:23` — default `autoRotate` to `false` when the user has reduced-motion preference. Same in MapViewer for globe autoRotate. Pairs well with 1.5 (no autoRotate → frameloop stays demand).

### 1.7 Preconnect for Google Fonts
Add to `src/app/layout.tsx` `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
```
A11y/SEO bonus territory — but easy LCP win for /scrollable which loads 12 font families.

### 1.8 CSS animations: replace layout-triggering transitions
- `src/app/styles/animations.css:97` — `.link-underline::after` `transition: width 0.3s` → use `transform: scaleX()` + `transform-origin: left`.
- `src/app/styles/animations.css:140` — `.btn-shine::before` `transition: left 0.5s` → use `transform: translateX()`.

### 1.9 Optimize boot background image — `public/boot/bentos-boot-bg.png` (2.0 MB)
Single outlier (every other public asset is <500 KB). Two options:
1. Re-encode source as a 1024-wide AVIF + WebP fallback (likely <200 KB total).
2. If it's used as `background-image` in CSS, swap to `next/image` so AVIF negotiation kicks in automatically.

Action: grep for the asset reference, pick the cheaper path. Verify boot splash still feels right.

## Phase 2 — medium-impact, requires care

### 2.1 Idle-pause BentoGrid loops
- `src/components/BentoGrid/physics/usePhysicsWorld.ts:89` — `setInterval(applySettlingForces, 16)` runs forever. Gate it so the interval only fires when (a) a card just spawned, or (b) any body is awake. Skip when all sleeping. Also: add a `mounted` flag inside the closure to swallow late ticks after rapid unmount.
- `src/components/BentoGrid/views/DesktopCanvasView.tsx:147-166` — rAF spawn/despawn loop runs every frame even when nothing changes. Pause when camera velocity is zero **and** no cards are queued **and** no bodies are awake. Resume on pointer/keyboard/wheel input.

### 2.2 LODModel — `src/components/Dimension/scene/LODModel.tsx`
- Lines 30–61: replace the 1-second `setState`-based FPS sampling with a rolling-buffer rAF-based estimator, and write the LOD level into a ref so the switch is immediate. Currently the LOD change lags FPS drops by up to a second.
- No material disposal on unmount — add a cleanup `useEffect` that disposes the standard material.

### 2.3 Inline `style={{ ... }}` allocation in DesktopCanvasView
- `src/components/BentoGrid/views/DesktopCanvasView.tsx:455–458, 467–470` — category filter button style objects are re-allocated on every keystroke. Move to a `useMemo` keyed on `theme.accent.primary` (likely only ~2 colors).

### 2.4 React.memo card components (post–React Compiler review)
- `BaseCard`, `ProjectCard`, `PhotoCard`, `GameCard`, `MediaCard`. **Defer the manual `React.memo` until 1.2 (React Compiler) is in.** If the compiler memoizes them, this becomes a no-op. If for some reason it doesn't (verify with React DevTools Profiler), wrap manually and stabilize callback props with `useCallback`.

### 2.5 MediaCard hover callbacks
- `src/components/BentoGrid/cards/MediaCard.tsx:89–96` — wrap `handleHoverStart` / `handleHoverEnd` in `useCallback` so memoized children don't break. Also covered by React Compiler if enabled.

### 2.6 Lazy markdown rendering in Chat
- `src/components/Chat/parts/MessageItem.tsx:4` — `react-markdown` (~30 KB gzip) loads as soon as Chat hydrates. Wrap the markdown component in its own `dynamic(() => import('react-markdown'), { ssr: false })` boundary so Chat skeleton paints before the parser arrives. Low-priority — Chat is already lazy.

### 2.7 ImageViewer priority gating
- `src/components/Viewfinder/viewers/ImageViewer.tsx:51` — `priority` is unconditional. Gate to `priority={index === 0}` (or first visible).

### 2.8 MutationObserver debounce in map-globe-hooks
- `src/components/Viewfinder/viewers/map-globe-hooks.ts:40–46` — fires on every site-wide style mutation. Debounce ~50 ms before re-reading palette.

### 2.9 collapsible-widget — single resize observer
- `src/components/Dimension/ui/widgets/collapsible-widget.tsx:38–51` — uses both `window.resize` listener and a `ResizeObserver`. Drop the `resize` listener; `ResizeObserver` covers all relevant cases.

## Phase 3 — structural / judgment calls

### 3.1 Replace boot Canvas loading fallback with CSS
- `src/components/Dimension/Dimension.viewport.tsx:111–139` — falls back to a full `<Canvas>` just to render a spinner. Static `<div>` + CSS animation is cheaper. Small win but conceptually cleaner.

### 3.2 Globe canvas mobile tuning
- `src/components/Viewfinder/viewers/MapViewer.tsx:332` — `antialias: true, alpha: true` always. On mobile, flip `antialias: false`. Tiny but compounds with frameloop="demand".

### 3.3 Investigate DesktopCanvasView ref-sync churn
- `src/components/BentoGrid/views/DesktopCanvasView.tsx:126–127, 136` — three separate ref-sync `useEffect`s. Confirm none have missing deps; consider consolidating. React Compiler may resolve these implicitly.

### 3.4 Sync scripts on every dev/build
- `predev` and `prebuild` run `sync:projects` + `sync:photos` + `validate:content`. Check that these are skippable when content hasn't changed (cheap mtime/hash check) — could shave seconds off every `npm run dev`.

## Things explicitly verified GOOD (don't touch)

- Three.js / R3F / drei / matter-js are properly walled off from the home-page bundle (route-level `dynamic({ ssr: false })`).
- `react-pdf`, `lucide-react`, `d3-geo`, `topojson-client` are properly code-split.
- `@upstash/redis` + `@upstash/ratelimit` are server-only (in API route).
- All fonts use `display: 'swap'` (no FOIT).
- `next/image` is used consistently with `sizes` + blur placeholders.
- LazyMotion is wrapped at all three page roots.
- Theme pre-hydration script prevents flash correctly.
- Most disposal patterns (ProceduralCat, GLTFModel, useCamera momentum) are right.
- Mobile branches (shadows off, dpr cap 1.5, no physics on mobile) are correct.

## Bonus a11y / SEO notes (not perf, but free to land alongside)

- `src/components/Dimension/useDimensionController.ts:23` — also handled by 1.6 above.
- Verify `aria-modal="true"` on `CollapsibleWidget` and `KeyboardShortcutsModal` (audit only — no edit yet).
- `GameCard` icon needs an `aria-label` on its wrapper (purely decorative icon today).
- `ImageViewer` alt text is generic (`Image ${index+1}`). If sidecars carry captions, plumb them through.

## Verification checklist after each phase

```bash
npm run type-check
npm test
npm run lint
npm run build
npm run size            # gzip-bundled First-Load JS budget (1.5 MB cap)
npm run lighthouse      # Perf / LCP / TBT / CLS — record deltas
npm run e2e             # smoke through Playwright
```

Manual: load /, /projects, /playground, /playground/pacman, /scrollable, /photography on desktop + mobile-emulated. Confirm boot splash still feels right; confirm BentoGrid pan/scroll is smooth; confirm 3D viewer doesn't strand frames.

## Recommended ordering for shipping

1. **Phase 1.1 + 1.3 + 1.4 + 1.7 + 1.8** in one PR — zero-risk wins, easy review.
2. **Phase 1.2 (React Compiler)** as its own PR — needs careful regression testing.
3. **Phase 1.5 + 1.6** in one PR — `frameloop="demand"` + reduced-motion gating, paired.
4. **Phase 1.9** in its own commit — image asset replacement.
5. **Phase 2** items individually, in priority order: 2.1 → 2.2 → 2.3 → rest.
6. **Phase 3** only after Phase 1+2 numbers land; revisit need.

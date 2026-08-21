# GOAL: Implement bentOS performance optimization plan

Working directory: `bentosite` worktree at `.claude/worktrees/optimization-audit` (branch `worktree-optimization-audit`). Full audit and plan in `OPTIMIZATION_PLAN.md` at the worktree root — read it before starting. CLAUDE.md at the repo root is the project rulebook (especially "Common pitfalls" section).

## Operating rules

- Ship in **phased PRs** in the order listed below. Do NOT bundle Phase 1.2 (React Compiler) with anything else — it has the largest blast radius and needs its own diff.
- After every phase, run the verification gates in `OPTIMIZATION_PLAN.md` ("Verification checklist after each phase") and **paste the numeric deltas into the commit message** (First-Load JS gzip, Lighthouse Perf/LCP/TBT/CLS).
- If a verification gate fails, fix the underlying issue — never bypass (`--no-verify` is forbidden per CLAUDE.md).
- No "AI co-authored" trailers in commits (CLAUDE.md rule).
- Don't change files outside the listed scope per phase. If you find a related issue, note it at the end of the phase commit message; don't rewrite it inline.
- Treat the audit findings as load-bearing — every file:line below was identified by a research pass. If reality has drifted (file renamed, line moved), re-grep and proceed; don't skip.

## Baseline first

Before touching code:

```bash
npm run build && npm run size               # capture First-Load JS gzip baseline
npm run lighthouse 2>&1 | tee /tmp/lh-baseline.log   # Lighthouse baseline
ANALYZE=true npx next build --webpack       # (optional) regenerate .next/analyze/client.html
```

Save the baseline numbers — append them to the first commit's body so reviewers see the starting point.

---

## Phase 1A: zero-risk wins (single PR)

### 1A.1 — Drop unused dependencies

```bash
npm uninstall @react-three/postprocessing postprocessing yet-another-react-lightbox
```

Verify with `rg "postprocessing|yet-another-react-lightbox" src` — must return zero hits. Run full verification gates.

### 1A.2 — Memoize ThemeContext

File: `src/lib/theme-context.tsx`
- Around line 87 (the `<ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>` block): wrap `value` in `useMemo` keyed on `[theme, toggleTheme, setTheme]`.
- Wrap `setTheme` in `useCallback(() => ..., [])` if it isn't already a stable reference.

### 1A.3 — Heavy `motion` → lightweight `m`

LazyMotion + domAnimation is correctly mounted at `src/app/page.tsx:96`, `src/app/HomeClient.tsx:5`, `src/app/scrollable/page.tsx:125`. Replace `motion`/`from 'framer-motion'` with `m` in the children below (replace `motion.div` → `m.div`, `motion.span` → `m.span`, etc., and update the import):

- `src/components/BentoOS/BootScreen.tsx:3`
- `src/components/BentoOS/TerminalPrompt.tsx:4`
- `src/components/Dashboard/DashboardLayout.tsx:5`
- `src/app/playground/rhythm/page.tsx:4`
- `src/components/Playground/AimTrainer/AimTrainer.tsx:3`
- `src/components/Playground/SortingVisualizer/SortingVisualizer.tsx:3`
- `src/components/Playground/Pacman/Pacman.tsx:3`
- `src/components/Playground/TypingGame/TypingGame.tsx:3`
- `src/components/Playground/Game2048/Tile.tsx:3`
- `src/components/Playground/RhythmGame/RhythmGame.tsx:3`
- `src/components/Playground/RhythmGame/HitCircle.tsx:3`
- `src/components/Playground/RhythmGame/AudioUploader.tsx:3`
- `src/components/Playground/RhythmGame/modes/ManiaGame.tsx:3`
- `src/components/Playground/RhythmGame/modes/TaikoGame.tsx:3`

`AnimatePresence` stays imported as-is (no `m` equivalent). After: `rg "\bmotion\." src/components src/app | grep -v '// '` should only show files inside LazyMotion-less surfaces, if any. Verify no visual regression on each route.

### 1A.4 — Preconnect for Google Fonts

File: `src/app/layout.tsx`, in the `<head>` block (near the existing pre-hydration script):

```tsx
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
```

### 1A.5 — CSS layout-triggering transitions → transform

File: `src/app/styles/animations.css`
- Line ~97 (`.link-underline::after`): swap `transition: width 0.3s ease` for `transform: scaleX()` with `transform-origin: left` and `transition: transform 0.3s ease`.
- Line ~140 (`.btn-shine::before`): swap `transition: left 0.5s ease` for `transform: translateX()` and `transition: transform 0.5s ease`.

Eyeball both effects in dev (`npm run dev`) — they should be visually identical.

### 1A.6 — Optimize boot background

File: `public/boot/bentos-boot-bg.png` (2.0 MB — the only outlier).

1. `rg "bentos-boot-bg" src` to find references.
2. If used via `next/image`: AVIF/WebP is already negotiated automatically — leave the source alone. (Verify the consumer passes `sizes` correctly.)
3. If used as a CSS `background-image` or raw `<img>`: re-encode to AVIF (target <200 KB) and update the reference. Keep the original `.png` as a fallback only if the consumer is CSS.

**Phase 1A verification:** run all gates. Commit message must include baseline → new First-Load JS gzip and Lighthouse deltas. Title: `perf: phase 1A — zero-risk bundle and animation wins`.

---

## Phase 1B: React 19 Compiler (separate PR, biggest blast radius)

File: `next.config.ts`
- Add `experimental.reactCompiler: true` (keep `optimizePackageImports` as-is).
- Install the babel plugin if Next/Turbopack requires it: `npm install --save-dev babel-plugin-react-compiler@latest`.
- If a `.babelrc` or `babel.config.js` is needed for Turbopack interop in Next 16, set it up minimally per the latest Next docs (use `mcp__plugin_context7_context7__resolve-library-id` + `query-docs` for `next.js` / `react-compiler` to confirm current setup).

Validate by clicking through:
- `/` — boot splash → dashboard, toggle theme, send a chat message
- `/projects` — pan grid, click a card, open viewer
- `/playground` and one game (`/playground/pacman`)
- `/scrollable` — scroll all sections
- `/photography` — open the lightbox

Run all verification gates. **Use React DevTools Profiler** (manual step — note in commit if you can't): record a 5s session on `/projects` panning the grid, confirm BentoGrid card components no longer rerender on every camera tick. If they still do, file a follow-up issue rather than reverting — the rest of the phase still benefits.

Title: `perf: enable React 19 Compiler`.

---

## Phase 1C: 3D frameloop + reduced-motion (single PR)

### 1C.1 — Dimension Canvas

File: `src/components/Dimension/Dimension.viewport.tsx` (around line 187)
- Add `frameloop="demand"` to `<Canvas>`.
- Plumb `invalidate` from `useThree` into: auto-rotate toggle, model swap, OrbitControls `onChange`, keyboard shortcut handlers in `useDimensionController.ts`.

### 1C.2 — Map Canvas

File: `src/components/Viewfinder/viewers/MapViewer.tsx` (around line 329)
- Add `frameloop="demand"` to `<Canvas>`.
- Globe `autoRotate` (line ~354) drives motion — confirm OrbitControls' `enableDamping`/auto-rotate triggers `invalidate()` automatically; if not, plumb manually.
- The marker pulse `useFrame` (~line 131): keep it on, but it'll only run when invalidated. Force invalidation on hover/selection state change.

### 1C.3 — Reduced-motion gating for autoRotate

File: `src/components/Dimension/useDimensionController.ts:23`
- Default `autoRotate` to `false` when `window.matchMedia('(prefers-reduced-motion: reduce)').matches`. Same default-respect on MapViewer.
- Guard `window`/`matchMedia` for SSR.

Manual QA: open `/` with the OS-level reduced-motion preference on — Dimension should not auto-rotate, globe should not auto-rotate.

Title: `perf: 3D canvases frameloop=demand + respect reduced-motion`.

---

## Phase 2: contained perf fixes (one PR per item, or batch 2.1+2.2 together)

### 2.1 — Idle-pause BentoGrid loops

File: `src/components/BentoGrid/physics/usePhysicsWorld.ts` (around line 89)
- The `setInterval(applySettlingForces, 16)` runs forever. Wrap the body: if `engine.world.bodies.every(b => b.isSleeping)` and no card-spawn flag is set, skip the tick.
- Inside the closure, capture a `let mounted = true` and check it; the cleanup must set `mounted = false` before `clearInterval`. Prevents late ticks after rapid unmount.

File: `src/components/BentoGrid/views/DesktopCanvasView.tsx` (lines ~147–166)
- The rAF spawn/despawn loop should pause when (a) camera velocity is zero, (b) no spawn queue activity, (c) all physics bodies asleep. Resume on pointer/wheel/keyboard input — wire those listeners to set a ref that the rAF loop checks.

Title: `perf: idle-pause BentoGrid physics and spawn loops`.

### 2.2 — LODModel

File: `src/components/Dimension/scene/LODModel.tsx`
- Lines 30–61: replace the 1-second `setState`-driven FPS sampler with a rolling rAF-window estimator that writes into a ref; the LOD level change should be immediate, not delayed by a setState tick.
- Add a `useEffect` cleanup that disposes the standard material on unmount (geometries are drei-cached; don't touch them).

### 2.3 — Inline style allocations

File: `src/components/BentoGrid/views/DesktopCanvasView.tsx` (lines ~455–458, 467–470)
- Hoist the category-filter button `style={{ background, border }}` objects into a `useMemo` keyed on `[theme.accent.primary]`. Likely two variants (active/inactive); destructure inline.

### 2.4 — Lazy markdown in Chat

File: `src/components/Chat/parts/MessageItem.tsx` (around line 4)
- Replace the static `import ReactMarkdown from 'react-markdown'` with a `dynamic(() => import('react-markdown'), { ssr: false, loading: () => <span className="..." /> })`. Chat skeleton will paint before react-markdown loads.

### 2.5 — ImageViewer priority gating

File: `src/components/Viewfinder/viewers/ImageViewer.tsx` (around line 51)
- Change `priority` to `priority={index === 0}` (or the first-visible equivalent).

### 2.6 — MutationObserver debounce

File: `src/components/Viewfinder/viewers/map-globe-hooks.ts` (lines ~40–46)
- Wrap the observer callback in a 50ms debouncer (one `setTimeout` ref, cleared each call). Cleanup must `clearTimeout`.

### 2.7 — collapsible-widget single observer

File: `src/components/Dimension/ui/widgets/collapsible-widget.tsx` (lines ~38–51)
- Remove the `window.addEventListener('resize', ...)`. Keep the `ResizeObserver`. Cleanup must still remove only what was added.

Each Phase 2 item: separate commit, verification gates after every commit. Titles: `perf: <area> <specific fix>`.

---

## Phase 3 (only after Phase 1+2 numbers are in)

Defer until baseline deltas are visible. Items:
- 3.1 — Replace Canvas loading fallback with CSS (`Dimension.viewport.tsx:111–139`)
- 3.2 — MapViewer mobile antialias=false branch (`MapViewer.tsx:332`)
- 3.3 — Consolidate DesktopCanvasView ref-sync effects (verify React Compiler hasn't already neutralized this)
- 3.4 — Sync-script skip when content unchanged (`package.json` `predev`/`prebuild`)

Don't start Phase 3 until reviewer-approved Phase 2.

---

## Bonus (a11y/SEO, free to ride along)

Land in whichever phase covers the same file:
- 1C — `useDimensionController.ts:23` already covers reduced-motion autoRotate (perf + a11y twofer).
- Phase 2 — `GameCard` decorative icon needs an `aria-label` on its wrapper (check `src/components/BentoGrid/cards/GameCard.tsx`).
- Phase 2 — `ImageViewer` alt text is generic. If photo sidecars in `public/photos/<slug>.json` carry captions, plumb them through.
- Audit-only: `aria-modal="true"` on `CollapsibleWidget` and `KeyboardShortcutsModal` — open issue, don't fix inline.

---

## Forbidden actions

- No dep upgrades beyond what this prompt specifies.
- No `--no-verify` on commits or pushes.
- No `git push --force` to `main`.
- No renaming files outside the scope of the phase.
- No introducing new dependencies in Phase 1+2 except `babel-plugin-react-compiler` in 1B (if required).
- No CLAUDE.md edits unless the Phase 2/3 work invalidates a documented invariant (and even then, separate PR).

## Done definition

All of Phase 1A, 1B, 1C, and Phase 2 (2.1–2.7) shipped with verification gates green in CI. Final commit body or PR description includes a delta table:

| Metric | Baseline | After 1A | After 1B | After 1C | After 2 |
|--------|----------|----------|----------|----------|---------|
| First-Load JS (gzip) | … | … | … | … | … |
| Lighthouse Perf (/) | … | … | … | … | … |
| LCP (/) | … | … | … | … | … |
| TBT (/) | … | … | … | … | … |

Phase 3 deferred unless the table shows insufficient gain.

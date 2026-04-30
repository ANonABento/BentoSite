# Contributing

## Maintainability Rules

- Keep files focused. If a component mixes state orchestration, rendering, and low-level helpers, split it before it becomes a catch-all file.
- Aim to keep files under roughly 300 lines. Use feature-local hooks, config, types, and subcomponents instead of stretching one file.
- Prefer explicit feature boundaries. Public imports should come from root barrels like `@/components/Dimension`, not internal implementation paths.
- Use CSS variables and shared token helpers for colors. Avoid hardcoded Tailwind palette classes like `red-500`, `violet-400`, or `orange-500`.
- Follow the styling source order already used in this repo:
  1. global utility classes from `src/app/globals.css`
  2. feature or design token modules
  3. non-color Tailwind utilities
  4. inline styles for genuinely dynamic values only
- Keep client/server boundaries explicit. Browser-only logic belongs in client components or hooks, and Three.js modules must stay SSR-disabled.
- Avoid server/client drift in rendered text. Locale- or timezone-sensitive formatting should wait until client mount unless the value is intentionally server-stable.
- Extract side effects into hooks when a component starts managing timers, storage, analytics, network calls, or DOM APIs inline.
- When persisting high scores or run summaries, guard writes so a finished run is saved once. Avoid effects that can re-fire on derived score state and inflate counters.
- Keep public APIs narrow. Prefer a few clear props over boolean prop piles or large “options” bags.
- Reuse shared loading and error primitives instead of redefining spinners, overlays, and fallback shells inside routes.
- Keep route transitions, scroll reveal, and animated UI paths wired through shared utilities so reduced-motion behavior remains consistent.
- Preserve SEO routes and structured data when changing route names, project URLs, or content fields. Update `src/lib/seo.ts`, `src/app/sitemap.ts`, and tests together when needed.
- Preserve accessibility affordances when refactoring interactive surfaces: skip links, focus traps, ARIA state, keyboard navigation, and visible focus styles are part of the feature contract.
- Write tests around behavior that should survive refactors: loading states, retry paths, token-backed variants, persistence helpers, and critical interactions.
- API routes should fail closed on bad input. Parse JSON defensively and return `400` for malformed request bodies instead of converting client mistakes into generic `500`s.

## Feature Patterns

- For `Dimension`, keep scene primitives, viewer state, and UI overlays in separate modules. Avoid importing internal scene files outside the feature.
- For `BentoGrid`, keep camera/card-pool behavior in `core/`, search UI and state in `cards/`, physics in `physics/`, and layout helpers in `layout/`. Route custom cards through the `renderCard` prop.
- For route-heavy pages like `src/app/scrollable`, keep the route file mostly about composition and move route-specific state into hooks or private `_components`.
- For chat-like features, keep storage, session logic, and rendering separate so persistence and request flow can be verified independently.
- For Playground modes, separate game rules from presentation. Hook code should own timers, collisions, scoring, and persistence boundaries; route/components should mostly own layout and feedback.
- For RhythmGame specifically, keep upload/audio analysis, generated beatmaps, and mode-specific engines separate from the main shell.

## Before You Merge

- Run `npm run type-check`
- Run `npm run lint`
- Run `npm run test`
- If you changed route structure or SSR boundaries, run `npm run build`

# Kevin Jiang Portfolio

Next.js 16 portfolio site for Kevin Jiang with four main route surfaces:
- `Dashboard`: bentOS-style landing page with a 3D viewfinder, terminal chat, skills panel, and project links
- `Scrollable`: long-form portfolio view with lazy-loaded sections, featured project filtering, timeline, skills, and chat
- `Projects`: BentoGrid-powered portfolio archive
- `Playground`: BentoGrid-powered interactive game and experiment hub

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Three.js with `@react-three/fiber` and `@react-three/drei`
- Matter.js for BentoGrid card physics
- Vitest for unit tests

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run type-check
npm test
```

## Project Structure

```text
src/app/                App Router entrypoints, metadata routes, and route layouts
src/components/         Feature components, route surfaces, and UI primitives
src/content/            Portfolio source content
src/lib/                Shared helpers, SEO builders, tokens, constants, and data shaping
public/                 Static assets, project media, and model files
```

## Key Areas

- `src/components/Dimension/`: 3D viewer shell, controller hook, canvas viewport, scene loaders, and viewer widgets
- `src/components/BentoGrid/`: in-progress shared infinite grid system for `/projects` and `/playground`
- `src/components/Projects/`: featured project cards, filtering, modal archive, and project media helpers
- `src/components/Playground/`: game routes and split game modules, including `RhythmGame` audio analysis and mode-specific engines
- `src/components/Chat/`: chatbot storage, request hooks, types, and presentational parts; `src/components/Chat.tsx` is the compatibility entrypoint
- `src/components/ui/`: loading skeletons, route fallbacks, page transitions, scroll reveal, toast, and error primitives
- `src/components/seo/`, `src/lib/seo.ts`, `src/app/sitemap.ts`, and `src/app/robots.ts`: JSON-LD helpers, sitemap data, robots metadata, and SEO tests
- `src/app/styles/`: theme, utility, animation, and content CSS layers
- `docs/bentogrid-handoff.md`: current BentoGrid rebuild notes and drift checklist

## Current Architecture Notes

- Route files stay thin where possible. Heavy browser-only surfaces such as the 3D viewer, chat, BentoGrid, and playground games load behind dynamic client boundaries with route-level fallbacks.
- Projects use `src/lib/projects-data.ts` as the shared pipeline for featured cards, BentoGrid cards, archive browsing, thumbnails, dates, and media metadata.
- BentoGrid consolidates the older grid experiments into one card pool/camera/physics system. Desktop uses an infinite pan/zoom canvas with Matter.js physics; mobile falls back to a filtered scroll view while the search-card behavior continues to be polished.
- Dimension is split between the public shell (`Dimension.tsx`), controller state (`useDimensionController.ts`), canvas viewport (`Dimension.viewport.tsx`), scene primitives (`scene/`), and UI widgets (`ui/`).
- Chat is split into storage, hooks, typed props, and memoized parts. Timestamps wait for client mount to avoid locale hydration drift.
- RhythmGame is split across core osu-style play, audio upload/analysis, generated beatmaps, and Taiko/Mania mode engines.
- SEO is handled through Next metadata, generated Open Graph/Twitter images, `robots.ts`, `sitemap.ts`, escaped JSON-LD scripts, and tested schema builders.
- Loading skeletons and route fallbacks live in shared UI primitives; page transitions and scroll reveal honor reduced-motion preferences.
- Accessibility coverage includes skip-to-content, keyboard shortcut help, focus traps, ARIA labels/pressed states, reduced-motion paths, and keyboard navigation in grid surfaces.

## Notes

- Project content is sourced from `src/content/portfolio.json`.
- Prefer semantic CSS variables and shared utility classes over hardcoded Tailwind colors.
- Three.js surfaces should stay client-only via dynamic import with `ssr: false`.
- For Playground score persistence, avoid save loops triggered by reactive score state. Finished runs should be persisted once per run, not once per rerender.
- `npm run build` currently emits a non-blocking `baseline-browser-mapping` freshness warning even though the repo is already on the latest published package version.

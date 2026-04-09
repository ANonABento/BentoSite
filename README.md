# Kevin Jiang Portfolio

Next.js 16 portfolio site for Kevin Jiang with three main surfaces:
- `Dashboard`: OS-style landing page with the 3D viewer, chatbot, and modal project archive
- `Scrollable`: long-form portfolio view with featured projects, timeline, and skills
- `Playground`: interactive game and experiment hub

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Three.js with `@react-three/fiber` and `@react-three/drei`
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
src/app/                App Router entrypoints and route layouts
src/components/         Feature components and UI primitives
src/content/            Portfolio source content
src/lib/                Shared helpers, tokens, constants, and data shaping
public/                 Static assets
```

## Key Areas

- `src/components/Dimension/`: 3D viewer and scene plumbing
- `src/components/Projects/`: featured projects and archive browser
- `src/components/Playground/`: games, hub, shared game UI
- `src/components/Chat/` and `src/components/Chat.tsx`: chatbot entrypoint and internal modules
- `src/app/styles/`: theme, utility, animation, and content CSS layers

## Recent Refactor Areas

- Projects now use a single richer data pipeline from `src/lib/projects-data.ts` for featured cards, archive browsing, thumbnails, and media metadata.
- Playground now has a stronger hub shell, shared semantic surface utilities, and cleaned-up naming and styling across the game surfaces.
- Dimension now reports real loader progress in its fallback UI instead of controller-only placeholder state.
- Chat and feedback API routes now reject malformed JSON with `400` responses, and chat timestamps defer locale formatting until client mount to avoid hydration drift.
- Recent gameplay fixes tightened weak modes:
  - Aim Trainer: moving targets in tracking mode, despawned targets count as misses, clearer pointer-lock recovery
  - Pacman: eaten ghosts respawn correctly and life-loss pauses are distinct from manual pauses
  - Rhythm: empty clicks count as misses and preset-vs-custom audio behavior is explained in UI

## Notes

- Project content is sourced from `src/content/portfolio.json`.
- Prefer semantic CSS variables and shared utility classes over hardcoded Tailwind colors.
- Three.js surfaces should stay client-only via dynamic import with `ssr: false`.
- For Playground score persistence, avoid save loops triggered by reactive score state. Finished runs should be persisted once per run, not once per rerender.
- `npm run build` currently emits a non-blocking `baseline-browser-mapping` freshness warning even though the repo is already on the latest published package version.

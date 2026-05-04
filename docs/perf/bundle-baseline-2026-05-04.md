# Bundle Baseline - 2026-05-04

Task: Perf 2.1b bundle audit and code splitting for bentosite.

## Measurement

- Command: `ANALYZE=true npx next build --webpack`
- Analyzer reports:
  - `.next/analyze/client.html`
  - `.next/analyze/nodejs.html`
  - `.next/analyze/edge.html`
- Note: `npm run analyze` uses the Next.js 16 default Turbopack build. The configured `@next/bundle-analyzer` reported that Turbopack is unsupported, so webpack was used for analyzer artifacts.

## Route Entry Delta

Route entry sizes are based on each route's client reference manifest chunks. These numbers do not include interaction-triggered dynamic chunks.

Status: the heavy optional chunks below were split or verified as route-isolated, but the route entry table did not reach the planned 20% reduction target. The remaining route entry cost is dominated by shared framework/runtime chunks and route shells.

| Route | Baseline gzip | After gzip | Delta |
| --- | ---: | ---: | ---: |
| `/` | 73.0 KB | 73.0 KB | 0.0 KB |
| `/scrollable` | 78.4 KB | 78.4 KB | 0.0 KB |
| `/projects` | 73.4 KB | 73.4 KB | 0.0 KB |
| `/playground` | 73.4 KB | 73.4 KB | 0.0 KB |
| `/playground/2048` | 73.8 KB | 73.8 KB | 0.0 KB |
| `/playground/aim-trainer` | 73.9 KB | 73.8 KB | -0.1 KB |

## Deferred Heavy Chunks

| Area | Deferred chunk(s), gzip | Notes |
| --- | ---: | --- |
| BentoGrid desktop canvas | 5.9 KB + 4.3 KB | Desktop grid canvas code is split from the BentoGrid shell. Mobile grid rendering no longer has to load the desktop canvas module up front. |
| Matter.js physics | 25.2 KB | Matter remains isolated to the desktop physics path and is not present in `/playground/2048` route entry chunks. |
| Aim Trainer 3D scene | 2.2 KB + 4.2 KB | The aim trainer shell loads without the scene module; the Three/R3F scene loads when play starts. |
| React Three Fiber shared chunk | 15.1 KB | Three/R3F code is still isolated to 3D viewer/game paths and is not present in `/playground/2048` route entry chunks. |
| Chat markdown renderer | 33.3 KB | `react-markdown` is split out of the chat shell and loads as its own chunk when assistant markdown is rendered. |

## Suspect Audit

- Matter.js: imported only by BentoGrid physics modules. It is now behind the desktop canvas split and is not part of `/playground/2048` route entry chunks.
- Three.js / React Three Fiber: used by Dimension, MapViewer, and Aim Trainer Scene3D. Dimension and media viewers were already dynamic; Aim Trainer Scene3D is now dynamic.
- Chat panel: `/scrollable` only mounts chat when opened. The dashboard still renders chat as part of the visible terminal, but markdown parsing is now a separate chunk.

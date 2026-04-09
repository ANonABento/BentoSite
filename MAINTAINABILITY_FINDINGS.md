# Maintainability Findings

## Open Decisions

1. Dimension loading progress is still present in the UI, but the viewer does not currently receive real loader progress events. We can either wire this to a shared Three.js `LoadingManager` or remove the progress bar entirely. That choice affects user experience more than code structure.

## Notes

- The current refactor removed the highest-value color/token drift in shared UI, chat, and the reaction/results flow.
- The project surfaces now share one richer data pipeline. Featured cards and the archive modal both derive thumbnails, media state, and dates from `src/lib/projects-data.ts` instead of maintaining parallel project-shaping logic.
- The playground hub now has a stronger top-level shell, a local-score summary strip, a more intentional grid layout, and shared `pg-button` utilities that were previously referenced in multiple game screens without being defined.
- The follow-up consistency sweep replaced the remaining Playground/Projects opacity literals with shared semantic utilities (`pg-chip`, `pg-input`, `pg-progress-track`, `project-overlay-chip`, etc.) and aligned the visible Playground naming away from the older `Fidget` label.
- The terminology cleanup pass removed the old `FidgetGrid` / `FidgetCard` compatibility exports and updated stale repo-level labels in `README.md`, `CLAUDE.md`, and `AGENTS.md`.
- The gameplay pass fixed several correctness issues in weaker modes: Pacman ghosts now respawn after being eaten, Aim Trainer tracking mode now actually moves targets and counts expired targets as misses, and Rhythm now penalizes empty clicks instead of silently ignoring them.
- The gameplay pass also exposed a persistence pitfall: score saves tied directly to reactive score state can retrigger and inflate `gamesPlayed`. Aim Trainer and Pacman now guard against duplicate end-of-run writes.
- The playground token layer is now actually defined globally. Before this pass, many `var(--pg-...)` usages and shared classes like `pg-label` / `pg-gradient-radial` existed in components without corresponding CSS definitions.
- The remaining gaps are mostly consistency work, not blockers for shipping the structural cleanup in this branch.
- Mechanical verification is currently clean on this branch:
  - `npm run type-check`
  - `npm run lint`
  - `npm test`
  - `npm run build`
- The earlier `InfiniteGrid` algorithm test mismatch was resolved by aligning the spec with the actual layout contract: `calculateBentoLayout` includes the central `__search__` card in the returned layout map.
- `react-simple-maps` and its unused type package were removed. The Viewfinder globe now depends directly on `d3-geo` and `topojson-client`, which were previously only present transitively.
- `next build` still emits a non-blocking `baseline-browser-mapping` freshness warning even after pinning the latest top-level package version, which implies the message is coming from a transitive toolchain dependency rather than the root manifest.

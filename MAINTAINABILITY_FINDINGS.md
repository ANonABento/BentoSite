# Maintainability Findings

## Open Decisions

- No open product decisions are blocking this branch right now.

## Notes

- The Dimension viewer loading indicator now reflects actual loader progress via the scene loading manager instead of controller-only placeholder state.
- The feedback API now validates payload shape, content lengths, and bad JSON more defensively, which prevents malformed client payloads from becoming 500s or writing arbitrary junk into the local feedback store.
- The chat API now also rejects malformed JSON with a `400` instead of treating parse failures as generic server errors, keeping request validation behavior aligned across both API routes.
- Chat message timestamps now wait for client mount before locale formatting, which avoids hydration drift between server and browser timezone/locale settings.
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
- `next build` still emits a non-blocking `baseline-browser-mapping` freshness warning. As of April 9, 2026, `npm view baseline-browser-mapping version` returns `2.10.16`, which matches the installed version in this repo, so there is no local package update available to silence it yet.

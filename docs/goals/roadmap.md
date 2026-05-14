# bentOS — roadmap

Loose backlog of follow-ups, not a committed plan. Each item lists the
leverage (small / medium / large) and the rough next step. When an item
turns into committed work, spin it out into its own `docs/goals/<date>-<slug>.md`.

Last refreshed: 2026-05-14 after the viewfinder-project-context goal.

---

## DoD gaps from `2026-05-14-viewfinder-project-context.md`

### Wire a real 3D model for at least one featured project — small, blocked on asset

- **What**: the goal's DoD required at least one featured project to ship
  a real `.glb` through the Viewfinder. Still on the procedural cat default
  for every project.
- **Why it stalled**: `reazon-research/openarm_robosuite_models` is the
  obvious candidate (matches `robotic-arm-puppeteer`) but the meshes are
  split per-link STL/OBJ files — `Model3DViewer` loads one file.
  Composing a unified GLB requires a Blender pass that's out of scope for
  a markdown skill.
- **Next step**: ask Kevin for a Fusion 360 → GLB export of the OpenArm
  puppet (or the MaidReal head). Drop under `public/models/<id>/main.glb`
  and set `links.modelPath`. The `/update-portfolio` 3D sub-flow now
  handles this cleanly.

### Live-test the VID and PDF Viewfinder tabs — small

- **What**: no project in the corpus currently sets `media.video` or
  `media.pdf`. Both viewer paths are committed but unexercised.
- **Risk**: silent regression — a viewer-side bug wouldn't be caught by
  the test suite (none of our tests render those viewers with real data).
- **Next step**: pick one Devpost project (most hackathon submissions
  have a YouTube link) and one project with a real PDF report (e.g.
  `pcb-design`, `robotic-arm-puppeteer`). Wire `media.video` / `media.pdf`
  via `/update-portfolio` and click through the rendered tabs.

### Dogfood the `/update-portfolio` multi-asset flow — small

- **What**: the skill's new Step 6 (Multi-asset wiring) was written and
  shipped but never run end-to-end. Each sub-flow's prompt phrasing,
  file-copy commands, and validation steps are best-effort but unverified.
- **Risk**: the first real user runs into a logic gap or wrong path
  convention.
- **Next step**: run the skill against a throwaway test project (e.g.
  add a fake `roadmap-test` project, exercise each of the six tab
  sub-flows, delete it).

---

## Quality / polish

### Eliminate Strict-Mode dev double-send in chat — small

- **What**: in development, the project-rundown auto-send can fire twice
  because React 19 Strict Mode unmounts and remounts the effect, and
  `projectPromptSentForRef` is per-instance.
- **Production impact**: none — Strict Mode double-invocation doesn't
  ship.
- **Dev impact**: cosmetic; can confuse contributors poking at the chat.
- **Next step**: hoist the "sent for project id" tracker to module scope
  (`Set<string>` keyed on project id). Or use the chat's existing
  storage to dedupe consecutive identical user messages.

### Post-clear greeting should acknowledge the project — small

- **What**: clicking Clear in project mode resets the chat to the
  generic post-clear greeting. The visitor is still on a project URL —
  the greeting could nudge them ("Chat cleared! Ask me anything about
  <project name>.").
- **Where**: `src/components/Chat/Chat.hooks.ts:96` (clearChat builds the
  reset message).
- **Next step**: thread `selectedProject` into the chat (currently the
  chat is unaware of which project the dashboard is showing). Mutate
  `clearChat` to use a project-aware greeting when set.

### Cross-project navigation animation polish — medium

- **What**: when `?project=A` → `?project=B`, the panels swap content in
  place with no transition cue. A visitor running through multiple
  projects can lose track of which one they're on.
- **Next step**: gate the existing `dashboardStagger` variant on
  `selectedProject?.id` so each project change re-runs the entrance
  animation, even for in-SPA navigations.

### Boot-skip semantics review — small

- **What**: `isDashboardDeepLink` now returns true for both
  `?view=dashboard` and `?project=`, but the variable `isDashboardView`
  fed into `resolveBootState` is the same boolean. The shape works but
  the naming asymmetry is a small smell.
- **Next step**: rename `isDashboardView` →
  `bootSplashShouldBeSkipped` (or similar) in `lib/boot-session.ts`.
  Update all call sites + the test in `boot-session.test.ts`.

---

## Coverage / observability

### Run lighthouse + bundle-size + Playwright e2e locally — small

- **What**: CI runs `npm run lighthouse`, `npm run size`, and
  `npm run e2e` on PRs (`.github/workflows/ci.yml`). Local runs only do
  type-check + lint + unit + build.
- **Risk**: catch perf regressions in PR review instead of locally.
- **Next step**: add a `npm run ci` script that runs all five gates
  and document in `CLAUDE.md`. Especially worth running after
  `babel-plugin-react-compiler` toggling — the recent dep churn
  showed how easily local + CI can diverge.

### SkillsSection mobile-variant test — small

- **What**: `SkillsSection` is rendered twice in `DashboardLayout` (once
  for desktop, once inside the mobile chat tab). Only the desktop variant
  is rendered in the unit test. Mobile-only render bugs (e.g. animation
  variant inheritance) wouldn't be caught.
- **Next step**: extend `SkillsSection.test.tsx` with a render under a
  width-mocked viewport.

### Component-level test for the DashboardLayout auto-send — medium

- **What**: the chat auto-send-on-project-mount is currently only
  covered by a contract test (every project has a registered starter).
  The actual `useEffect → chatFns.send` mechanism isn't directly tested.
- **Next step**: render `DashboardLayout` with a mocked `Chatbot` whose
  `onReady` exposes a spy `send`. Assert `send` is called once with
  `Tell me about <project.name>` when `initialProjectId` is set.

---

## Content backlog

### Hero images / Devpost media for the 18 stub projects — large

- **What**: most projects ship `text + featuredImage` only. Each project
  card is therefore visually generic. Adding a Devpost video, a hero
  image, or a short PDF report per project would meaningfully lift the
  /projects experience.
- **Constraint**: time-consuming and per-project. Bulk-attack via
  `/update-portfolio` runs, not a single goal.
- **Suggestion**: pick a Friday and bulk-add Devpost YouTube videos to
  the 6 hackathon projects (`litter-caching`, `taser-derby`,
  `snapfire`, `shoulder-cupid`, etc.) — Devpost auto-generates video
  thumbnails so these are usually the lowest-effort win.

### Map per-project highlights — deferred

- **Decision**: Kevin confirmed the map stays as life-experience
  locations only. No per-project highlights. Documented as a standing
  preference in the `/update-portfolio` schema doc.
- **No next step** — included here so future agents don't re-propose
  it.

### Pick a specific itch.io game URL for `unity-game-dev` — small

- **What**: currently wired to the profile URL (`anonabento.itch.io/`),
  which falls through to GameViewer's "Open game" CTA. A specific game's
  embed URL would iframe properly.
- **Next step**: Kevin picks one (UWGDC Best Overall winner is the
  natural headline). One-line edit to `media.game.url`.

---

## Architecture / refactor candidates (no commitment)

### Centralize URL state in a hook — medium

- **What**: today `page.tsx` is the only consumer of `useSearchParams`
  for `project`/`view`. If more routes start reading deep-link state
  (e.g. `/playground?game=X`), a shared `useDashboardLinkState()` hook
  in `lib/` would prevent drift.
- **Trigger**: when a second route needs the same pattern.

### Generated content schema validation in TS, not just JSON — medium

- **What**: `scripts/validate-content.mjs` validates the portfolio JSON
  at sync time. There's no compile-time check that
  `src/lib/projects-data.ts`'s `Project` type matches the JSON shape.
- **Trigger**: when a content shape change is silently mis-typed and
  causes a runtime crash in production.

### Move chat-knowledge starter-map keys into a typed registry — small

- **What**: `STARTER_RESPONSES` is a `Map<string, string>` built by
  iterating projects/skills and `normalizeText`'ing trigger phrases. A
  typo in a trigger breaks the contract test silently (the project just
  doesn't get a starter).
- **Trigger**: low — the contract test catches the obvious case. Worth
  considering when adding new starter categories.

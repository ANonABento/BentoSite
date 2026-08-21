# bentOS — roadmap

Loose backlog of follow-ups, not a committed plan. Each item lists the
leverage (small / medium / large) and the rough next step. When an item
turns into committed work, spin it out into its own `docs/goals/<date>-<slug>.md`.

Last refreshed: 2026-08-21 after the launch-polish-and-studio goal.

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

### Live-test the VID and PDF Viewfinder tabs — small, blocked on assets

- **2026-08-21**: all six linked Devpost pages (`taser-derby`, `shoulder-cupid`,
  `snapfire`, `litter-caching`, `expressive-ai-robot-head`, `ar-gesture-robot`)
  were checked for embedded demo videos. None have one, so the easy path to
  exercising the video viewer does not exist — this needs a YouTube link or a
  PDF report from Kevin.


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

### Eliminate Strict-Mode dev double-send in chat — done 2026-08-21

- The tracker is a module-scoped `Set<string>` now, so a Strict Mode remount cannot re-send the rundown.

### Post-clear greeting should acknowledge the project — done 2026-08-21

- `projectName` is threaded through TerminalPanel to the chat; clearing in project mode keeps the context.

### Cross-project navigation animation polish — done 2026-08-21

- The viewfinder panel replays a short opacity fade on project change (no transform — that would break the glass blur below it).

### Card counters show the duplicate-filled total — done 2026-08-21

- `countDistinctCards` (in `duplicate-fill.ts`) counts ids with the clone
  suffix stripped; both views pass the distinct total to `SearchMenuCard`.

### Category chips scroll out of the search panel — done 2026-08-21

- The row now has an explicit scroll arrow (shown only when the categories
  cannot fit), which wraps back to the start at the end. The chips were always
  clickable — the problem was that five of eight started off-view with only a
  gradient to advertise them.

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

### Run lighthouse + bundle-size + Playwright e2e locally — done 2026-08-21

- `npm run ci` chains lint + type-check + test + build + lighthouse + size, documented in CLAUDE.md.

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

---

## Launch configuration

### Set `NEXT_PUBLIC_SITE_URL` in Vercel — small, blocked on Kevin

- **What**: `siteConfig.url` now resolves `NEXT_PUBLIC_SITE_URL` →
  `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL` → `http://localhost:3000`. Until
  the first is set in the Vercel project, canonical tags and the sitemap name
  whatever Vercel calls the deployment rather than the real domain.
- **Why it matters**: this replaced a hard-coded `https://kevinjiang.dev`,
  which belongs to a different Kevin Jiang (github.com/jiang-kevin). Every
  canonical, sitemap URL, robots `Host`, OG image, and JSON-LD `@id` pointed at
  that stranger's blog, and the bentOS project card's live-demo link and
  embedded website tab did too.
- **Next step**: Kevin confirms the launch domain; set it in the Vercel project
  for all environments, and put it back on `bentosite.json` as `links.liveDemo`
  if he wants the project card to link to the live site.

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

- **Candidates** (from the itch.io profile, 2026-08-21): Bandwidth, Entitled
  Goose Game, Happy Santa Go Time, PROJECT: Apartment. The first two live under
  `matthewz80.itch.io`. An embed needs the game's `/embed/` URL, not the page URL.


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

---

## Carried over from the old root docs (2026-08-21)

`ROADMAP.md`, `IMPROVEMENTS.md`, `MAINTAINABILITY_FINDINGS.md`, and the two
`split-*.task.md` refactor specs were deleted from the repo root: the refactors
they described have shipped (`Chat/`, `BentoGrid/`, and `Dimension/` are all
split), and most of their open checkboxes were already done (E2E tests, CI,
light/dark theming, Framer Motion). These are the items that were still real:

- **"View More" expansion for long project descriptions** — cards truncate to
  two lines and the modal shows everything; there is no middle state.
- **Print-friendly styles** — no `@media print` rules anywhere.
- **External-link indicators** — outbound links (GitHub, Devpost, itch) look
  identical to internal navigation.
- **Chat interaction analytics** — `lib/analytics.ts` tracks email copies but
  not chat questions, which are the most interesting signal on the site.
- **Continue image optimization for project media** — several heroes are small
  or wrong-shaped for a wide card (see the launch-polish goal).
- **Contact form** — optional; the email-copy button covers the need today.

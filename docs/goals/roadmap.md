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

### Route-level error recovery — done 2026-08-21

- `/projects`, `/photography`, `/playground`, and `/scrollable` — the Matter.js
  and WebGL routes — had no error boundary, so a throw replaced the page with
  Next's bare "Application error" on white. `app/error.tsx` now covers every
  segment that does not define its own (retry, link home, `error.digest`), and
  `app/global-error.tsx` covers a root-layout failure with self-contained
  styling, since none of the app CSS loads in that case.

### Boot-skip semantics review — done 2026-08-21

- `isDashboardView` is now `skipBootSplash` across `boot-session.ts`,
  `page.tsx`, and the test, and the field carries a comment saying the caller
  owns what counts as a reason to skip.

---

## Coverage / observability

### Run lighthouse + bundle-size + Playwright e2e locally — done 2026-08-21

- `npm run ci` chains lint + type-check + test + build + lighthouse + size, documented in CLAUDE.md.

### SkillsSection mobile-variant test — closed 2026-08-21, nothing to test

- Checked before writing the test: `SkillsSection` contains no viewport
  branching at all — no `isMobile`, no `matchMedia`, not even a `md:` class —
  and `DashboardLayout` passes it identical props at both call sites. There is
  no mobile *variant*; the difference is entirely the parent's wrapper.
- `DashboardLayout.test.tsx` already asserts both instances render when the
  mobile tab is opened, which is the real behaviour. A width-mocked render of
  the component would assert nothing, so it was not added.

### Component-level test for the DashboardLayout auto-send — done 2026-08-21

- `DashboardLayout.test.tsx` renders with a stub `Chatbot` exposing a spy
  `send`. The once-only guard moved into `autoPromptTracker.ts` and is tested
  directly, because a Strict Mode double-invoke cannot be forced reliably from
  a jsdom render — the first version of that test passed with the guard
  deleted.

---

---

## Surface visibility

### Everything stays exposed until a dedicated flag session — decided 2026-08-21

- **Decision**: Kevin wants every route reachable for now, including
  `/photography`, so he can see and test the whole site before deciding what
  ships. The site is not publicly launched yet, so nothing is being hidden.
- **Superseded recommendation**: an earlier suggestion to hide `/photography`
  from the nav was declined for exactly this reason. Do **not** re-propose
  hiding routes ad hoc — that call happens in the flag session below.
- **Known state of `/photography`**: it currently contains no photographs. Six
  entries are generated colour blocks (flagged by `npm run launch:audit`) and
  the other six are project documentation posters that also appear on
  `/projects`. This is a content gap, not a code one.
- **Next step**: a "flag session" — go through every surface together and
  decide what is public at launch and what is held back, then implement
  whatever gating that needs. Nothing to build before that conversation.

---

## Launch configuration

### Configure Upstash for real chat throttling — small, blocked on Kevin

- **What**: `/api/chat` calls a paid model. Until 2026-08-21 it served every
  request unthrottled whenever Upstash was unconfigured, which is the default.
  There is now a per-instance in-memory fallback, but it is weak by nature: on
  serverless each instance keeps its own counters and instances are ephemeral,
  so a flood spread across IPs or cold starts is not fully caught.
- **Next step**: set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in
  the Vercel project (free tier). The fallback then stops being used. A
  production boot without them warns in the build log.

### Confirm the chat provider key is set in Vercel — small, blocked on Kevin

- **What**: with no `GOOGLE_GENERATIVE_AI_API_KEY` (or `OPENAI_API_KEY`),
  `/api/chat` returns `isDemoMode: true` and serves deterministic canned
  answers. The chat is the centrepiece of the dashboard, so this degrades
  silently and invisibly.
- **Next step**: ask the deployed site a question that is not one of the
  scripted starters and see whether the answer is real.

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

## Branch cleanup — 2026-08-22

Thirty stale remote branches and two open PRs were removed. All of them predate
the May 2026 history rewrite, so they sit on a lineage `main` no longer shares —
each showed a phantom diff of up to 238 files against `main` while containing
nothing `main` needs. (Squash merges cause the same illusion: the branch behind
PR #95, merged the same day, also read as "ahead=14".)

**Nothing is lost.** Every tip commit is listed below and remains reachable in
GitHub's reflog; a branch can be restored with
`git push origin <sha>:refs/heads/<name>`.

### Closed pull requests

- **#91** "Security audit: API hardening + 429 helper + framework fingerprint".
  Its rate limiting is superseded by the in-memory limiter added in #103, and
  `main` already carries the security headers. Its only unique content was an
  `/api/feedback` route — the roadmap treats a contact form as optional, since
  the email-copy button covers the need — and a security audit document.
- **#90** "boot splash polish", a draft marked "needs UI design". The boot
  splash has been reworked twice since (Orbitron wordmark, CRT power-on, and
  the build-date stamp in #109), so the draft no longer applies. It also
  carried about 1 MB of PNG screenshots.

### Deleted branches

| Branch | Tip | Last commit | Subject |
|---|---|---|---|
| `bentoya/blog-writing-section-at-writing-with-mdx-support` | `f5e15a5` | 2026-04-30 | Add sample MDX writing post and keep turbopack root in workt |
| `bentoya/ci-b-8-ci-speedup-caching-pass-bentosite` | `1a37fcd` | 2026-05-04 | refactor(BentoGrid): dedupe search card content components |
| `bentoya/docs-b-2-claude-md-refresh-mermaid-architecture-be` | `eba6943` | 2026-05-04 | docs(bentosite): CLAUDE.md refresh + architecture diagrams |
| `bentoya/feat-b-6-animated-cursor-effects-on-hover-from-ice` | `795bb6f` | 2026-05-04 | fix(cursor): clean up animation and token usage |
| `bentoya/gate-4-2-performance-gates-ci-strict-lighthouse-bu` | `e6ea548` | 2026-05-04 | fix(ci): derive bundle routes from Lighthouse config |
| `bentoya/perf-2-1b-bundle-size-audit-code-split-bentosite` | `b890b8e` | 2026-05-04 | Fix 3D canvas aria semantics |
| `bentoya/perf-2-2b-lighthouse-audit-fixes-bentosite` | `3bdc425` | 2026-05-04 | fix: clean up BentoGrid search card code |
| `bentoya/security-audit-smaller-surface-api-routes-deps` | `59f22d1` | 2026-05-04 | refactor(api): consolidate 429 response into rate-limit help |
| `bentoya/seo-3-2-metadata-sweep-ci-validator-gate-bentosite` | `904586e` | 2026-05-04 | Fix 3D canvas accessibility role |
| `bentoya/ux-t4-card-semantics-chip-overflow-info-card-refac` | `c77b1c2` | 2026-05-04 | fix(bentogrid): stabilize desktop view effects |
| `bentoya/ux-t5-color-system-unification-orange-primary-purp` | `ae34eb2` | 2026-05-04 | Fix Playwright dynamic port selection |
| `bentoya/ux-t7-light-polish-bundle` | `db6edaa` | 2026-05-04 | Fix projects link accessible label |
| `chore/t5-cleanup` | `a065028` | 2026-05-04 | chore(theme): re-apply dropped T5 color tokens on BentoGrid  |
| `draft/boot-splash-polish` | `db73496` | 2026-05-04 | feat(splash): session-scoped boot with multi-input dismiss + |
| `fix-cursor` | `91ac180` | 2026-05-04 | feat(cursor): trail + magnetic hover effect on interactive e |
| `fix-shipblockers` | `5e80253` | 2026-05-04 | fix(ui): redo ship-blockers bundle (resume URL, Assistant re |
| `fix/post-rebase-type-contracts` | `d22e0d7` | 2026-05-04 | fix(types): resolve post-rebase type contract breaks in Bent |
| `launch-polish-and-studio` | `26279be` | 2026-08-21 | Bring the roadmap up to date |
| `staging/batch-20260504064051154` | `6e38b5b` | 2026-05-04 | UX T7 — Light polish bundle (#69) |
| `staging/batch-20260504064210510` | `656cacc` | 2026-05-04 | UX T4 — Card semantics + chip overflow + info card refacto |
| `staging/batch-20260504064836909` | `31925b3` | 2026-05-04 | UX T5 — Color system unification (orange primary, purple A |
| `staging/batch-20260504075947836` | `7f27b11` | 2026-05-04 | Perf 2.2b — Lighthouse audit + fixes (bentosite) (#75) |
| `staging/batch-20260504080937167` | `64231d8` | 2026-05-04 | Perf 2.1b — Bundle size audit + code split (bentosite) (#7 |
| `staging/batch-20260504082800830` | `d6fc249` | 2026-05-04 | SEO 3.2 — Metadata sweep + CI validator gate (bentosite) ( |
| `staging/batch-20260504083859176` | `9c0763f` | 2026-05-04 | Merge pull request #81 from ANonABento/bentoya/gate-4-2-perf |
| `staging/batch-20260504083859459` | `3f5badb` | 2026-05-04 | feat(splash): session-scoped boot with multi-input dismiss + |
| `staging/batch-20260504104823023` | `be52834` | 2026-05-04 | fix(ui): redo ship-blockers bundle (resume URL, Assistant re |
| `staging/batch-20260504194218771` | `0dfacb6` | 2026-05-04 | docs(bentosite): CLAUDE.md refresh + architecture diagrams ( |
| `staging/batch-apr29` | `48c2b91` | 2026-04-29 | fix: align BentoGrid search and layout behavior |
| `ui/boot-splash-rework` | `196a14a` | 2026-05-04 | feat(splash): session-scoped boot with multi-input dismiss + |

---

## Unshipped work

### Animated cursor — dropped 2026-08-21

- **Decision**: Kevin does not want it. The site keeps the native cursor.
- **No next step** — recorded here, like the map-highlights entry, so future
  agents don't re-propose it or "restore" it as missing work.
- **Background**: `CLAUDE.md` and `docs/architecture.md` described an animated
  cursor subsystem (`components/cursor/`, lerp trail, magnetic pull toward
  `[data-magnetic]`, a `magnetic` prop on `BaseCard`) as if it were live. It
  never existed on `main` — it was built in PR #84 (`1aa30d1`) on a branch that
  was never merged, which `git merge-base --is-ancestor` confirms. The
  documentation was removed in #107 so the docs describe the actual code.
- **If it ever comes back**, `1aa30d1` still holds the implementation, and
  `BaseCard` would need a `magnetic` prop again — it has none today.

### Why the cursor vanished: main's history was rewritten in May 2026

- Fourteen PRs merged into `main` around 2026-05-04 have merge commits that are
  no longer ancestors of `main` (#57, #66, #68, #70, #72, #74, #76, #78, #80,
  #83, #84, #85, #86, #89). Something rewrote the branch after they landed.
- **Content mostly survived the rewrite** — checked individually, not by SHA:
  `RESUME_URL` (#86), the boot splash (#68), the E2E CI workflow (#57) and the
  T5 token *usages* (#85) are all present today. A changed SHA is not lost work.
- **Two things did not.** The cursor (#84) is gone entirely — that is why the
  docs described a subsystem with no code behind it. And the T5 token
  *definitions* never came back: #85's own description says they were "dropped
  during a `--ours` conflict resolution", which is exactly why `--primary*`,
  `--success*` and `--ai` were referenced everywhere and defined nowhere until
  #106. #85 also confirms the intended mapping — "non-AI surfaces consistently
  land on `--primary` (orange)" — which is what #106 implemented.
- **Nothing else is outstanding.** #57's title mentions pre-commit hooks, but
  husky and lint-staged appear in no revision of `package.json` in the entire
  history, so they were never committed and nothing was lost there.
- **No next step** — recorded so that the next unexplained "documented but
  missing" feature is recognised as this, rather than re-investigated.

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

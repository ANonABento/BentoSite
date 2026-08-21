# Goal — Launch polish, then a local Studio

Owner: Kevin
Opened: 2026-08-21
Status: proposed

Two things stand between bentOS and being sent to people: it isn't polished
enough to survive a recruiter's first ten seconds, and there is no way to add
or change content without an agent or a JSON editor. This plan does the polish
first, then builds the editor, then uses the editor to fill in the content.

## Baseline (measured 2026-08-21)

Healthy: `npm run lint` clean, `npm run type-check` clean, 332/332 unit tests
pass, `npm run launch:audit` reports **0 blocking gaps**, all 21 projects have a
`featuredImage` that resolves on disk.

So the automated gates are green and the problems are the ones gates don't
catch — visual ones.

---

## Phase 1 — Polish and bug pass

### 1A. Verified visual defects

Each of these was reproduced against `npm run dev` at 1440×900 and 390×844.

| # | Where | Defect |
|---|---|---|
| 1 | `/projects` mobile | Card title + description render straight onto the hero image with no scrim. "bentOS — This Portfolio" over a bright screenshot and "ShoulderCupid" over the white bust are both unreadable. Desktop hides the overlay until hover (`ProjectCard.tsx` docblock), so mobile is the only broken path. |
| 2 | `/projects` mobile | Duplicate titles. The generated cover images bake the project name into the artwork and the card renders the name again below it — `component-cop` and `clanker-spanker` each read their name twice, which looks like a rendering bug. |
| 3 | `/projects` desktop | No card carries a label at rest. A wall of cropped screenshots with no titles until hover means a visitor can't scan the archive. |
| 4 | `/photography` | Hydration mismatch error in console on every load. `PhotographyGridClient.tsx` uses non-deterministic values (`Math.random` / `Date.now`) that differ between server and client render. |
| 5 | `/` desktop | The "Cat" info panel and the "Controls" panel float over the 3D viewport, overlap each other and the model, and cover roughly a third of the viewer. |
| 6 | `/` mobile | Header icon row overflows the viewport — the mail icon is clipped at the right edge. |
| 7 | `/` mobile | The first tab in the mobile tab bar renders an icon with no label next to a labelled "terminal" tab. |
| 8 | `/scrollable` | Purple is used for the generic "View My Robots" CTA and the word "robots" in the headline. The project's own rule (CLAUDE.md pitfall #3) reserves `--ai` purple for AI surfaces and `--primary` orange for generic CTAs. |
| 9 | `/scrollable` | ~250px of dead vertical space between the hero CTAs and "Scroll to explore" / About Me. |
| 10 | build | `npm run sync` warns on every run: `unity-game-dev.media.game.url` is a profile URL, not an embed URL, so the game viewer silently falls back to an external link. |

### 1B. First impression

Not bugs, but they decide whether the polish reads as intentional:

- **The name "Kevin Jiang" appears nowhere above the fold** on either the
  dashboard or `/scrollable`. The dashboard's first screen is a procedural cat;
  on mobile it is *only* the cat. The chat greeting is the first place the name
  appears. For a portfolio being sent to recruiters this is the single highest
  leverage fix.
- **Four projects share one generated cover template** — `choomfie`,
  `component-cop`, `clanker-spanker`, `dead-internet-reality` are all 1600×1000
  renders of the same layout. Side by side in the grid they make the archive
  look auto-generated. (Fixed with real images in Phase 3; the template itself
  is honest and fine as a fallback.)
- **Four heroes are too small or wrong-shaped** for a wide card and get
  upscaled or badly cropped: `litter-caching` 323×573, `snapfire` 430×573,
  `shoulder-cupid` 642×573, `the-closet` 600×600.

### 1C. Gates and perf

- Run `npm run lighthouse`, `npm run size`, and `npm run e2e` locally — today
  only CI ever runs them, so perf regressions are found in PR review.
- Add an `npm run ci` script that chains lint + type-check + test + build +
  lighthouse + size, and document it in CLAUDE.md. (Already on the roadmap.)

### 1D. Repo hygiene

- Stale tracked files at the repo root: `IMPROVEMENTS.md`,
  `MAINTAINABILITY_FINDINGS.md`, `ROADMAP.md` (duplicates
  `docs/goals/roadmap.md`), `split-chat-and-scrollable.task.md`,
  `split-unifiedgrid.task.md`, `projects-grid-current`.
- CLAUDE.md drift: it documents `/api/feedback`, which does not exist — the
  only API route is `/api/chat`.
- Roadmap items worth folding in while touching the same files: Strict-Mode
  chat double-send, project-aware post-clear greeting, cross-project
  navigation transition.

**Done when:** every row in 1A is fixed and re-screenshotted, the name is above
the fold on desktop and mobile, `npm run ci` passes end to end, and the root
directory holds only files that are still true.

---

## Phase 2 — Studio (local-only visual editor)

**Decision:** a dev-only `/studio` route in this repo. It never ships to
production, so there is no auth, no secrets, and no attack surface. It writes
the same files the CLI scripts already write. Scope is deliberately small:
**content CRUD plus an ordering list** — no drag-to-position on the canvas, no
in-place editing of the live page, no section composer.

### Write layer

Extract a `lib/content-repo` module that owns read / write / validate for
`src/content/projects/*.json`, `src/content/talking-points/*.json`,
`src/content/portfolio.json`, and `public/photos/*`. Both the existing
`scripts/add-*.mjs` CLIs and the Studio API call into it, so there is one
schema and one validator rather than two drifting paths. Keep the filesystem
access behind an interface — if you ever want a hosted version, that becomes
the only thing to swap.

### Surfaces

1. **Projects list** — table of all 21: thumbnail, name, category, status,
   featured toggle, and drag-to-reorder. This is the ordering model you asked
   for: the list order becomes an explicit `order` field on the project JSON;
   the top N get the prime grid positions and everything below is
   first-come-first-served by the existing layout engine. (`Project` has no
   `order` field today — sorting is `dateCompleted` descending — so this is a
   schema addition plus one change in the layout consumer.)
2. **Project editor** — a form over the real schema: name, short description,
   long description, category, status, technologies, links, media. Drop an
   image on it and it writes to `public/projects/<id>/`, normalizes with
   `sharp`, and sets `media.featuredImage`. Delete and duplicate buttons.
3. **Photos** — grid view, drop-to-add, edit the four sidecar fields
   (title, location, year, alt), delete. Runs `sync:photos` on save.
4. **Talking points** — list + form for the chat assistant's FAQ content.
5. **Bio** — form over `portfolio.json` (bio, skills, experience, education,
   contact).

### Save flow

Every save: write JSON → run `validate:content` → run `sync` → surface any
error inline instead of writing a broken file. A "Preview" link opens the real
route, and a "Commit & push" button stages the changed content files with a
generated message so a content session ends in a Vercel deploy without leaving
the browser.

### Guardrails

- `/studio` and `/api/studio/*` return 404 unless `NODE_ENV === 'development'`,
  and are excluded from the production build so they cost zero bundle bytes.
- A test asserts the studio routes are absent from a production build.
- The Studio is a tool, not a surface: it does not need the design polish the
  public site does.

**Done when:** a new project can be created, given a real hero image, ordered,
previewed, and pushed — without opening an editor or a terminal.

---

## Phase 3 — Content fill (using the Studio)

- Add the new projects.
- Replace the four generated covers with real screenshots.
- Replace the four undersized heroes.
- Add photos (12 today).
- Optional, already scoped on the roadmap: Devpost YouTube links for the
  hackathon projects, which exercise the never-tested video viewer path, and a
  real `.glb` for one hardware project.

---

## Sequencing

Phase 1 is ship-blocking and independent. Phase 2 unblocks Phase 3 and makes
every future content change cheap. Phase 3 is the one that actually makes the
grid look like a portfolio rather than a template, and it is gated on Phase 2
only for convenience — the CLI scripts can do it today if you'd rather not
wait.

---

# Outcome — 2026-08-21

Status: Phase 1 and Phase 2 complete. Phase 3 is blocked on assets only Kevin
has, and the gate that was supposed to catch that has been fixed so it now says
so out loud.

## Phase 1 — done

All ten defects in 1A were fixed and re-verified by screenshot at 1440×900 and
390×844:

1. **Card scrim** — `MediaCard`'s overlay used `to-transparent`, so on a
   content-sized box the title floated over bare artwork. The gradient now
   stays dark across its own box (`from-black/95 via-black/90 to-black/75`) and
   the title carries a text shadow.
2. **Duplicate titles** — `generate-project-cover.mjs` baked the name,
   category, description, and tech badges into the artwork, which the card
   overlay then rendered again. Covers are now abstract, with palette *and*
   geometry derived from the project id so no two look like the same template.
3. **Unlabelled grid** — new `titleAtRest` prop on `MediaCard`. Project and
   game cards keep the title readable at rest and expand only the meta block on
   hover (`grid-rows-[0fr]` → `[1fr]`); photo cards keep the hover-reveal
   gallery idiom. `GameCard`'s separate desktop title strip was removed as a
   duplicate.
4. **Photography hydration mismatch** — the grid sizes itself from
   `window.innerWidth` and SSR guessed 1920×1080. `/photography` now mounts
   behind `ssr: false` via `PhotographyRouteClient`, mirroring `/projects`.
   Console is clean on both routes.
5. **Viewer panel overlap** — both Dimension widgets start collapsed. The
   control panel also had a `useEffect` re-syncing `isCollapsed` to `isMobile`
   on every desktop render, which stomped any deliberate collapse; removed.
6. **Mobile header overflow** — social icons hide below `sm`, nav labels moved
   from `sm:` to `lg:`, tighter padding, and the theme toggle yields below
   360px. Verified no clipping and no horizontal overflow at 320/360/390/640/
   768/900/1024/1280/1440.
7. **Unlabelled mobile tab** — the active pill had `zIndex: -1`, painting it
   behind the panel and leaving white-on-white label text. Pill is now in flow
   with the content lifted above it.
8. **Purple on a non-AI CTA** — "View My Robots" and the headline gradient are
   orange; "Ask Me Anything" (which opens the chat) is the purple AI button.
9. **Dead space** — hero `min-h` 80vh → 70vh, tighter hero padding, and
   `AboutSection` now has lighter top padding than bottom. ~70px recovered.
10. **itch warning** — a bare profile URL can never be an embed, so warning on
    every build was noise. The validator now warns only for a specific game
    page that isn't in embed form. (Kevin's four itch games, for when he wants
    one embedded: Bandwidth, Entitled Goose Game, Happy Santa Go Time,
    PROJECT: Apartment.)

**1B — identity.** "Kevin Jiang" now appears above the fold on every route: the
compact header carries a two-line lockup (wordmark + name, plus the title at
`lg`), and the `/scrollable` hero eyebrow leads with the name.

**1C — gates.** Added `npm run ci` (lint + type-check + test + build +
lighthouse + size) and documented it. Lighthouse passes on all 14 routes;
bundle size 1.36 MB against a 1.5 MB budget.

**1D — hygiene.** Deleted `IMPROVEMENTS.md`, `MAINTAINABILITY_FINDINGS.md`,
`ROADMAP.md`, both `split-*.task.md`, and the stray `projects-grid-current` PNG,
after folding their genuinely-open items into `docs/goals/roadmap.md`. Fixed the
CLAUDE.md reference to a `/api/feedback` route that does not exist.

**Roadmap items folded in.** Strict-Mode chat double-send (module-scoped id set
instead of a per-instance ref), project-aware post-clear greeting (threaded
`projectName` through TerminalPanel → Chatbot), and a cross-project transition
cue on the viewfinder panel (replays a short fade on project change without
remounting the WebGL canvas).

### One bug the plan didn't know about: tablets couldn't open anything

Running the E2E suite locally (1C) surfaced a failing photography test. Chasing
it down found a real defect, not a flaky test: **on any touch device wide enough
to get the canvas view — every tablet — tapping a project or game card did
nothing.** The pan gesture (`@use-gesture`) captures the pointer, so `pointerup`
landed on the canvas container instead of the card under the finger and the
browser never dispatched a click to it.

Fixed with `pointer: { capture: false }` on the drag config in `useCamera.ts`.
Verified by CDP touch events at 1280×800: photography, projects, and playground
all open on tap, touch panning still works, and desktop mouse behaviour is
unchanged (click opens, drag pans without opening).

For the record, the two E2E failures were checked against a stashed baseline
before being touched: the theme-toggle failure was caused by this work (an early
version of the header hid the social links below `sm`; the header now wraps to a
second row on phones instead, so nothing is dropped) and the photography failure
was pre-existing.

The photography test was also opening the card with a synthetic mouse click
under touch emulation, which exercises a different path from a real tap; it now
taps on touch-capable projects. Worth knowing: CI runs `--project=chromium`
only, so the Mobile Chrome suite — the one that caught this — never runs there.
Adding it to the workflow would have caught the tablet bug months ago.

## Phase 2 — done

`/studio` and `/api/studio/*`, development only.

- **Isolation**: route files are `page.dev.tsx` / `route.dev.ts`;
  `pageExtensions` only registers `.dev.*` outside production. A production
  build was run to confirm: the route table contains no studio entry and
  `/api/chat` is still the only API route. `studio-isolation.test.ts` guards
  the file naming, the config, and the runtime guard.
- **One write path**: `scripts/content-repo.mjs` owns every read and write;
  `add-project.mjs` and `add-talking-point.mjs` were rewired through it.
- **Ordering**: dragging the project list writes an `order` integer;
  `build-content.mjs` sorts `order` first, then newest-first. Exactly the model
  Kevin asked for — top N pinned, the rest first-come-first-served.
- **Dogfooded**: created a project through the UI, uploaded a hero, reordered,
  and deleted it, verifying each step on disk. That run also surfaced a
  stale-closure bug in the drag handler (it reordered against an array from a
  previous render); fixed with a ref plus a functional state update, and
  re-verified.

## Phase 3 — blocked on assets, and the gate now says so

While screenshotting `/photography` I found that **six of the twelve photos are
generated colour blocks, not photographs** — `calibration`, `lab-after-hours`,
`machine-quiet`, `night-bus`, `orange-hour`, `signal-path`. They ship with
titles, locations, and years describing scenes that do not exist. The other six
are project documentation posters reused as photographs.

The launch audit reported "0 blocking gaps" through all of this, because it only
ever checked that a file existed. That blind spot is now closed:

- `scripts/detect-placeholder-images.mjs` flags photos whose quantised colour
  count reads as generated art (the six sit at 12–18; real photographs in this
  repo sit at 143+). The heuristic is deliberately **not** applied to project
  imagery — `bento-ya/hero.png` is a genuine app screenshot that quantises to
  15 colours.
- Generated project covers are tracked explicitly instead, in
  `public/projects/generated-covers.json`, written by the cover generator.
- `npm run launch:audit` reports both, and `--strict` now fails on them.

**Nothing was deleted.** Removing photos is Kevin's call, and the Studio's photo
tab does it in two clicks.

Also checked and genuinely unavailable: none of the six Devpost project pages
(taser-derby, shoulder-cupid, snapfire, litter-caching, expressive-ai-robot-head,
ar-gesture-robot) has a demo video, so there was nothing to wire into
`media.video` and the video viewer path remains unexercised.

### What Phase 3 needs from Kevin

1. Real photographs for the gallery, or delete the six placeholders.
2. Real screenshots for `choomfie`, `component-cop`, `clanker-spanker`,
   `dead-internet-reality`.
3. Better-shaped heroes for `litter-caching` (323×573), `snapfire` (430×573),
   `shoulder-cupid` (642×573), `the-closet` (600×600) — all are cropped or
   upscaled badly in a wide card.
4. The new projects he mentioned.

All four are Studio jobs now: `npm run dev`, open `/studio`, drag files in.

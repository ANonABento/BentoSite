# Goal: Make the dashboard project-aware (Viewfinder + Skills + Chat)

**Owner**: next agent (handoff)
**Repo**: `/home/anonabento/bentosite`
**Branch**: `main` (work directly, push when each milestone is green)
**Mode**: dogfood → audit → implement → loop. Ask focused questions only when blocked on user judgment (URLs, asset choices, naming) — never on routine engineering decisions.

---

## Mission

When a visitor clicks a project card and lands on `/?project=<id>`, the **whole dashboard should re-skin to that project**:

1. **Viewfinder** (already mostly works) — shows the project's media: 3D model, images, video, PDF, embedded site, game, map. Audit + fix gaps.
2. **System Info → Project Tools** — the skills panel currently always shows generic HW_MODULES / SW_STACK / DEV_TOOLS categories. When a project is selected, it should swap to that project's `technologies` array, grouped sensibly, with the same panel chrome.
3. **Terminal Chat** — should auto-surface the project's canned rundown (we already built `getStarterResponse` for this) instead of the generic greeting.

Then close the loop by **extending `/update-portfolio`** so future projects can ship 3D models, videos, PDFs, games, and maps via the skill — not just text + hero image, which is all the current `flows/project.md` covers.

---

## Current state (what I found auditing today)

**Works:**
- Project click on `/projects` → router push `/?project=<id>` → `DashboardLayout` reads `initialProjectId` from URL → `selectedProject` state set via `getProjectById()` → passed to `<Viewfinder project={selectedProject}>`. Viewfinder already builds its tabs dynamically based on which `project.media.*` / `project.links.modelPath` fields exist.
- Card images render after today's fix (`ProjectsGridClient` now uses `getProjectThumbnail` helper).
- Canned starter responses exist (`src/lib/chat-knowledge.ts:getStarterResponse`) and are wired into `/api/chat` — sending `Tell me about <project name>` short-circuits the LLM and returns a deterministic rundown.

**Broken / missing:**
1. `SkillsSection` is static — no `selectedProject` prop, no project-aware mode. Shows the same skills regardless of route state.
2. Nothing injects a "tell me about <project>" message into the chat on `?project=<id>` mount. Visitors get the generic greeting.
3. `/update-portfolio` skill (`.claude/skills/update-portfolio/flows/project.md`) never asks about:
   - 3D model files (`links.modelPath` slot — `.glb` / `.stl` / `.gltf` go under `public/models/<slug>/`)
   - Videos (`media.video` — YouTube URL or local file)
   - PDFs (`media.pdf` — file under `public/projects/<slug>/`)
   - Embedded websites (`media.website` — usually a live demo iframe)
   - Game embeds (`media.game` — `{ type: 'itch'|'unity-webgl', url }`)
   - Map locations (`media.map` — `{ locations: [...], highlightedIds: [...] }`)
4. `flows/project.md`'s GitHub branch never scrapes for these assets either (it only handles README hero images).

---

## Concrete outcomes — what "done" looks like

### A. Dashboard re-skin on project select

Land on `/?project=robotic-arm-puppeteer` (or any project id) and observe:

- Viewfinder panel switches to that project's media tabs (already happens — verify all 6 tab types work end-to-end with real project data).
- System Info panel header changes (e.g. `"system info"` → `"project tools — robotic-arm-puppeteer"`) and the categories now show the project's tech, e.g.:
  - **STACK**: Python, ROS2, OpenCV
  - **TOOLING**: Fusion 360, MeshCat, Three.js
  - **PROTOCOLS**: AprilTag, Dynamixel, Flask
  - (Grouping logic can be heuristic — match against a curated `category → tech[]` map in `src/lib/skill-categories.ts` (new file), fall back to "MISC".)
- Terminal panel renders the canned project rundown as the first message (use existing `getStarterResponse(\`Tell me about \${project.name}\`)` — it returns the full markdown rundown).
- Clear button still resets to the generic greeting.

### B. Viewfinder asset audit

For each project that *should* have these:
- A featured project gets a real 3D model (start with `robotic-arm-puppeteer` — the PDF mentions Fusion 360 CAD; reach out to Kevin for a `.glb` export, then drop under `public/models/robotic-arm-puppeteer/main.glb` and set `links.modelPath`).
- Game projects (`unity-game-dev`) point `media.game.url` at the itch.io page.
- Devpost hackathon projects can pull video from their Devpost gallery (Devpost has a video field; scrape it).
- Map-relevant projects can use `media.map.locations` to plot dots on the globe.

Don't try to fill *every* asset for *every* project — that's a forever job. Pick the 4–5 featured projects and do them well; flag the rest as "asset stub — fill via /update-portfolio later" in the report.

### C. Extend `/update-portfolio` flow

Edit `.claude/skills/update-portfolio/flows/project.md`:
- Add a **Step 6** (after the existing hero-image step) that asks via `AskUserQuestion` which Viewfinder tabs the project supports — 3D / Video / PDF / Website / Game / Map — multi-select.
- For each selected tab, branch to a per-asset sub-flow:
  - **3D**: ask for a file path or URL. If file path, copy to `public/models/<slug>/<filename>`. If URL, `curl` it down. Set `links.modelPath`. Confirm with `npm run build` that Next.js still serves it.
  - **Video**: ask for YouTube URL or file path. YouTube: validate via `yt-dlp --simulate` (if available) or a simple regex. File: copy to `public/projects/<slug>/`. Set `media.video`.
  - **PDF**: file copy to `public/projects/<slug>/<filename>.pdf`. Set `media.pdf`.
  - **Website**: ask for the URL; set `media.website`.
  - **Game**: ask for type (`itch` or `unity-webgl`) + URL. Set `media.game`.
  - **Map**: ask for comma-separated location IDs that exist in `src/lib/map-data.ts`. Set `media.map.locations`.

Update `schemas/project.fields.md` to document each of these (the existing schema doc only covers the basics).

Update the GitHub-branch automation in `flows/project.md` to attempt to scrape:
- A `*.glb` / `*.stl` file in `models/`, `assets/`, or `public/models/` of the repo
- A `demo` or `preview` video link in the README
- A live-demo URL in the repo's `homepageUrl` (already available via `gh repo view`)

---

## Implementation plan — suggested order

1. **Read the audit notes above. Then read these files in order:**
   - `src/components/Dashboard/DashboardLayout.tsx` — the routing root
   - `src/components/Skills/SkillsSection.tsx` — make it project-aware
   - `src/components/Viewfinder/Viewfinder.tsx` + `Viewfinder.types.ts` — tab logic
   - `src/lib/projects-data.ts` — the `Project` type + helpers
   - `src/lib/chat-knowledge.ts` — `getStarterResponse` (the canned rundown source)
   - `.claude/skills/update-portfolio/flows/project.md` + `schemas/project.fields.md` — the skill you'll extend
   - `src/content/AGENTS.md` — content playbook (do not skip)

2. **Wire skills panel to project mode (small, high-value first):**
   - Add `selectedProject?: Project` prop to `SkillsSection`.
   - When set, render `<ProjectToolsView project={selectedProject} />` (new sub-component in same file) instead of the generic three-category grid. Re-use `SectionHeader` for the chrome.
   - Categorize technologies via a small map; keep grouping conservative.

3. **Wire chat panel to project mode:**
   - In `DashboardLayout`, when `selectedProject` is non-null, on `chatFns` ready, call `chatFns.send(\`Tell me about \${selectedProject.name}\`)` once. The existing canned-starter path in `/api/chat` will return the rundown without burning Gemini quota.
   - Make sure `Clear` resets cleanly (it should — `handleClearChat` already exists).

4. **Viewfinder asset audit (manual + curate):**
   - For each of the 5–7 featured projects, list what assets they *could* have. Compare against current `links.modelPath` / `media.*`. Note gaps.
   - Pick 1–2 to ship real assets for in this pass (e.g. wire `robotic-arm-puppeteer.json` to point at an actual GLB if Kevin can share one). Ask if blocked.

5. **Extend `/update-portfolio`:**
   - Edit `flows/project.md` to add the multi-asset step + sub-flows.
   - Edit `schemas/project.fields.md` to document the new fields.
   - Add a test: run the skill end-to-end against a fake project and confirm the JSON has the right fields.

6. **Dogfood and visual audit:**
   - `PORT=4000 npm run dev`
   - Navigate to `/?project=robotic-arm-puppeteer`. Verify:
     - Viewfinder loads the right tabs.
     - Skills panel shows project tech, not generic skills.
     - Terminal panel shows the project rundown.
     - `Clear` button restores the generic state.
   - Repeat for 3–4 other projects with different media profiles.
   - Take screenshots, save to `/tmp/` (gitignored), reference in your final report.

7. **Type-check, lint, tests, build:**
   ```
   npm run type-check && npm run lint && npm test && npm run build
   ```
   All four must pass before any commit. Commit early and often (one logical change per commit).

---

## Quality bar

- **Code conventions**: see `CLAUDE.md` — colors via tokens, no raw hex, components under ~300 lines, real `<a href>` not `<button>+router.push` for navigation, framer-motion via `LazyMotion`.
- **Tests**: every new helper gets a Vitest spec. The current suite is at 297 tests; don't ship a feature that makes a test red. If you change behavior intentionally, update the test in the same commit.
- **Commit style**: imperative, one short title + bullets. No AI attribution trailers. Never `git add -A` — name files. Never `--no-verify`, never `--amend`.
- **Push cadence**: push after each green milestone (skills panel done, chat panel done, skill extension done). Vercel deploys auto.

---

## Loop: dogfood → audit → fix → repeat

After each milestone:

1. **Dogfood**: visit at least 3 project pages on `localhost:4000`. Compare to expected behavior. Capture issues.
2. **Visual audit**: take a screenshot of each project's dashboard view. Look for empty states, broken layouts, missing media, wrong fonts, wrong colors.
3. **Fix**: address each issue in a separate commit. No mass-fix commits.
4. **Verify**: re-run dogfood. Confirm fixed.
5. **Loop** to the next milestone.

Don't try to do everything in one shot. The order above (skills → chat → viewfinder audit → skill extension) is deliberately ordered to ship value early.

---

## When to ask the user

**Ask if:**
- A featured project needs an asset Kevin has to provide (a `.glb` file, an itch.io URL he hasn't shared, a video).
- A naming/UX decision could go multiple ways (e.g. is the panel header "project tools" or "project stack" or something else).
- A scope question: "should this also apply to the playground grid?" — yes/no, not assumed.
- The audit reveals something genuinely confusing about the existing code (rare — most stuff is well-documented).

**Don't ask:**
- Whether to run tests, lint, type-check (always yes).
- Which file to put a new component in (apply the existing structure — `src/components/<feature>/` for UI, `src/lib/` for helpers, tests adjacent in `__tests__/`).
- Whether to write a test (yes, every helper and every behavior change).
- Whether to commit a small WIP between milestones (yes, small commits beat big ones).
- Cosmetic preferences inside an established design system — match what's there.

Use `AskUserQuestion` for at most 2–3 round-trips total in this whole goal. If you find yourself wanting to ask more than that, you're probably overthinking — pick the most sensible option, ship it, and document the call in the commit message.

---

## Definition of done

- [ ] On `/?project=<id>`, Viewfinder, Skills, and Chat panels all reflect that project.
- [ ] `Clear` chat returns the dashboard to neutral state cleanly.
- [ ] At least one featured project has a real 3D model wired through Viewfinder.
- [ ] `/update-portfolio` skill asks about 3D / Video / PDF / Website / Game / Map fields and writes them correctly.
- [ ] `npm run type-check && npm run lint && npm test && npm run build` all pass.
- [ ] New behavior covered by at least 5 new Vitest specs (skills project-mode, chat auto-send-on-project, skill-categorization map, new flow's asset-writer, etc.).
- [ ] A short report committed back to this file under a `## Outcome` heading: what shipped, what was deferred, which projects still need assets.

---

## Reference: files you'll definitely touch

| Purpose | File |
|---|---|
| Routing root | `src/components/Dashboard/DashboardLayout.tsx` |
| Skills panel | `src/components/Skills/SkillsSection.tsx` |
| New skill-category map | `src/lib/skill-categories.ts` (new) |
| Chat hook integration | `src/components/Chat/Chat.tsx` or `DashboardLayout` (decide where the auto-send lives) |
| Viewfinder root | `src/components/Viewfinder/Viewfinder.tsx` |
| Project schema | `src/lib/projects-data.ts` |
| Canned rundown source | `src/lib/chat-knowledge.ts` |
| Skill itself | `.claude/skills/update-portfolio/flows/project.md` |
| Skill schema doc | `.claude/skills/update-portfolio/schemas/project.fields.md` |
| Featured projects pulled into the dashboard cards | `src/components/Projects/FeaturedProjects.tsx` |
| Content playbook | `src/content/AGENTS.md` |
| Code conventions | `CLAUDE.md` |

---

## Open questions for Kevin (ask in your first round-trip if you need them)

1. Do you have a `.glb` export of any robotics CAD (Robotic Arm Puppeteer or Expressive AI Robot Head) that we can ship as the default 3D model for those project pages? If yes — drop in `public/models/<slug>/main.glb` and I'll wire it.
2. For `unity-game-dev`, what's the itch.io URL for the best/most-featured game (Best Overall winner at UWGDC Fall 2024)? I'll set `media.game.url`.
3. For featured robotics projects, want to add map dots? (Reazon Tokyo, UW Waterloo, MakeUofT Toronto, etc.) — `media.map.locations` keyed off `src/lib/map-data.ts`.
4. Should the project panel header read "**project tools**", "**project stack**", or keep "**system info**" with a project subtitle? Strong preference?

---

## Outcome

Shipped (May 14, 2026):

- **da4e9c3 — Dashboard re-skins to project on `/?project=<id>`.**
  - `page.tsx` now reads the `project` query param via
    `useSyncExternalStore` (mirroring the existing `view=dashboard`
    pattern) and passes it as `initialProjectId` to `DashboardLayout`.
    Project deep-links additionally bypass the boot splash.
  - `DashboardLayout`: switched `selectedProject` from `useState`-with-
    init (which froze the SSR value of `undefined`) to a `useMemo`
    derived from `initialProjectId`. New `useEffect` auto-sends `Tell
    me about <project.name>` once the chat is ready; the existing
    `/api/chat` starter map returns the canned rundown without burning
    Gemini quota. The auto-collapse ref is pre-marked so the synthetic
    user message doesn't fold the tools panel away — in project mode
    the tools panel is the whole point.
  - `SkillsSection`: accepts an optional `selectedProject`. When set,
    the header swaps to `"project tools"`/`> <project-id>` and the body
    renders project-mode buckets (HARDWARE/STACK/TOOLING/MISC) using
    the same color tokens as the generic three-category view.
  - `src/lib/skill-categories.ts`: regex-driven categorizer with
    case-insensitive dedupe and canonical ordering. Misc bucket only
    appears when there are unmatched techs.
  - **Tests added**: 9 skill-categories specs, 3 SkillsSection render
    specs, 1 chat-knowledge contract spec (every project's
    `Tell me about <name>` opener resolves to a non-null starter). All
    310 specs green.

- **3cae862 — Wire `unity-game-dev` to itch.io profile.**
  - Added `media.game = { type: "itch", url: "https://anonabento.itch.io/" }`
    so the project surfaces a `PLAY` tab. The profile URL isn't a true
    iframe-embed target — `GameViewer` detects this and falls through
    to its "Open game" CTA, which is still the right UX.

- **b11b724 — Extend `/update-portfolio` with multi-asset Viewfinder flow.**
  - `flows/project.md`: new Step 6 "Multi-asset wiring" with six
    per-asset sub-flows (3D model, video, PDF, website, game, map),
    each documenting where to save the file, the viewer caveats
    (X-Frame-Options, HTTPS-only, itch embed-vs-profile, multi-mesh
    URDF bundles), and validation steps. Branch A (GitHub repo)
    auto-scrapes 3D files, README video links, and PDFs to pre-fill
    defaults rather than asking from scratch.
  - `schemas/project.fields.md`: OPTIONAL tier rewritten as a richer
    table mapping each field to the Viewfinder tab it surfaces, with
    viewer caveats inline. File path conventions updated for the
    per-project model sub-directory convention (`public/models/<id>/`).

### CI status

`type-check && lint && test && build` — all four green. 310 tests
passed (was 297 before — +13 new). Production build successful in 3.3s.

### Dogfood evidence

Verified via Playwright across three projects on `localhost:4000`:

- `/?project=robotic-arm-puppeteer` → `project tools` header with
  HARDWARE/STACK/TOOLING containing Dynamixel, Python+ROS2+OpenCV+
  AprilTag+Flask+Three.js, Fusion 360+MuJoCo+Isaac Sim+MeshCat. Chat
  auto-opens with the project rundown.
- `/?project=expressive-ai-robot-head` → project tools shows ESP32/
  FreeRTOS in HARDWARE; Python/PyTorch/CUDA/llama.cpp/Whisper/Silero
  VAD/Zonos/ROS2/OpenCV in STACK; Blender/Fusion 360 in TOOLING.
- `/?project=unity-game-dev` → Viewfinder has PLAY + MAP tabs; skills
  show STACK (C#/Unity/Emgu OpenCV/FSM/Visual Studio) + TOOLING
  (Blender).
- `/?project=bentosite` → Viewfinder has Gallery + Website + Map.
- `/?view=dashboard` → generic mode unchanged (system info / HW_MODULES
  / SW_STACK / DEV_TOOLS).
- Clear button correctly resets the chat to its post-clear greeting
  while keeping the skills panel in project mode (the URL still names
  a project — clearing the chat shouldn't navigate away).

Screenshots saved to `.playwright-mcp/` (gitignored worktree dir).

### Deferred / open

- **Real 3D model wiring** — Goal DoD item not yet ticked.
  - Searched Kevin's accessible repos (`ANonABento/*`,
    `reazon-research/*`, `MaidReal/*`). The only candidate was
    `reazon-research/openarm_robosuite_models` (PUBLIC, contains the
    OpenArm meshes for robotic-arm-puppeteer) but it's a multi-mesh
    URDF/MJCF bundle with ~30 split STLs/OBJs per-link — the viewer
    loads one file. Composing a unified GLB is out of scope for this
    pass.
  - Path forward: Kevin uses the new `/update-portfolio` 3D sub-flow
    once he has a unified GLB exported from Fusion 360 (the
    `robotic-arm-puppeteer.json` doc already mentions Fusion 360
    CAD).
- **Map per-project highlights** — confirmed via AskUserQuestion that
  Kevin wants the map to stay as life-experience locations only.
  Documented as a standing preference in
  `.claude/skills/update-portfolio/schemas/project.fields.md` and the
  skill's Map sub-flow.
- **Specific itch.io game URL** — Kevin noted "within itch, theres
  like 4 games"; shipped the profile URL as the entry point (CTA
  fallback). Switching to a specific game URL is a one-line edit
  via `/update-portfolio` when he picks a headline.
- **Per-project assets for the other 18 projects** — left as stubs.
  The skill extension makes adding them a one-AskUserQuestion-flow
  task.

### Header naming choice

Picked `"project tools"` (header) with `"> <project-id>"` (subtitle)
without asking — matches the goal doc's first example and reuses the
existing terminal-prompt aesthetic. If Kevin prefers `"project stack"`
or another label, it's a one-line edit in `SkillsSection.tsx:170`.

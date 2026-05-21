# Flow: add a project

Adding a project to bentosite. This flow is **deterministic** — follow the
numbered steps in order. Use `AskUserQuestion` at every decision point
listed; do not improvise alternative branching.

**Before you start**, re-read `schemas/project.fields.md` (sibling directory).
That card lists every field, required tier, and enum values. Keep it in mind
through the whole flow.

## Scripted fast path

If the project facts and local assets are already known, use the deterministic
writer instead of hand-editing JSON:

```bash
npm run add:project -- \
  --name "<name>" \
  --short-description "<one sentence>" \
  --category "<category>" \
  --status "<Completed|In Progress|Archived>" \
  --technologies "<comma,separated,tech>" \
  --date "<yyyy-mm-or-yyyy>" \
  --description "<longer prose>" \
  --github "<https-url>" \
  --hero "<local-image-path>" \
  --sync \
  --json
```

Useful optional flags: `--id`, `--featured`, `--demo`, `--docs`,
`--image <path[,path]>`, `--model <local glb/gltf/stl>`, `--video`,
`--pdf`, `--website`, `--game-url`, `--game-type itch|unity-webgl`,
`--dry-run`, `--overwrite`.

For an existing project that only needs a 3D model attached, use:

```bash
npm run add:model -- --project "<id>" --src "<local-model.glb-or-stl>" --sync --json
```

Prefer `.glb` for Blender/Fusion exports; plain `.gltf` files often reference
external `.bin` or texture files that the viewer will not copy automatically.

The script copies local assets into the correct public folders, validates the
project shape, and can regenerate `projects.generated.json`. After it
succeeds, run `npm test`, then commit only the file paths reported by the
script.

---

## Step 1 — Source router

Ask one `AskUserQuestion` to determine the source. Skip this if the user's
opening message already names the source unambiguously (e.g. they pasted a
GitHub URL — go directly to that branch).

```
Q: "Where's this project coming from?"
header: "Source"
options:
  - GitHub repo URL    → branch A
  - Devpost link       → branch B
  - Freeform (no link) → branch C
  - From this repo     → branch D (rare; "inception")
```

### Branch A — GitHub repo

1. Get the URL from the user.
2. Run `gh repo view <owner>/<repo> --json name,description,url,homepageUrl,languages,repositoryTopics,stargazerCount,pushedAt`.
3. If `gh` fails or is unauthenticated, fall back to `WebFetch` on the repo page.
4. `WebFetch` the README for a longer description and screenshot hints.
5. Map `languages` → `technologies` (top ~8 by size, drop docs-only langs
   like HTML/CSS unless the project is web-focused).
6. Set `dateCompleted` from `pushedAt` as `YYYY-MM`.
7. Status defaults to `"Completed"` unless the README says otherwise
   (active dev, WIP, etc.) — then `"In Progress"`.
8. Hero image: search the repo's `docs/`, `assets/`, `images/`,
   `screenshots/`, `media/` folders for a representative image. Either:
   - Reference the GitHub raw URL directly:
     `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>`, OR
   - Download to `public/projects/<id>/hero.png` for longevity (preferred).
9. `links.github` = the repo URL. If `homepageUrl` is set, that's `links.liveDemo`.
10. **Auto-scrape multi-asset candidates** — surface these in Step 6 as
    pre-filled defaults instead of asking from scratch:
    - **3D model** — list 3D files in the repo tree:
      ```bash
      gh api repos/<owner>/<repo>/git/trees/<branch>?recursive=1 \
        --jq '.tree | .[] | select(.path | test("\\.(glb|gltf|stl)$"; "i")) | .path'
      ```
      If exactly one unified mesh (`.glb`/`.gltf`) exists, propose it.
      Many split STL meshes (e.g. URDF/MJCF assets) usually aren't viewer-
      ready — skip rather than guess.
    - **Video** — look for `youtube.com`/`youtu.be`/`vimeo.com` links
      in the README; propose the first as `media.video`.
    - **Live demo** — `homepageUrl` from `gh repo view` is the
      `links.liveDemo` default. If absent, look for a Vercel/Netlify
      badge in the README.
    - **PDF** — list `*.pdf` files in `docs/`, `report/`, root; propose
      the largest as `media.pdf` (typically the report).

### Branch B — Devpost

1. `WebFetch` the URL.
2. Extract: project name (h1), tagline (`shortDescription`), Built With chips
   (`technologies`), Inspiration + What it does (combine into `description`).
3. Hero image is usually the first image after the title. Either reference
   the devpost-hosted URL or download to `public/projects/<id>/hero.png`.
4. `category: "Hackathon"` (the Devpost source overrides tech-based inference).
5. `links.docs` = the devpost URL. If a GitHub link appears on the page,
   `links.github` = that URL.
6. `dateCompleted` from the devpost "Submitted" date as `YYYY-MM`.
7. Status defaults to `"Completed"` (hackathons ship).

### Branch C — Freeform

1. The user has no link. Ask them for the minimum to draft from:
   ```
   Q: "What's missing so I can draft this?"
   header: "Quick facts"
   options: (multi-select)
     - Name only
     - Name + one-line description
     - Name + description + tech stack
     - I'll write it all in prose
   ```
2. Based on the answer, ask the corresponding fields as free text.

### Branch D — From this repo ("inception")

1. Use `git remote -v` to get the repo URL.
2. Treat as Branch A from there.
3. Live demo: `https://kevinjiang.dev` (or check `src/lib/site-config.ts` for
   `siteConfig.url`).

---

## Step 2 — Pick the `id`

Default: kebab-case slug from the project name.

- Strip articles (`a`, `the`).
- Lowercase, hyphens for spaces.
- Drop punctuation except hyphens.
- Cap at ~40 chars.
- Verify uniqueness: `ls src/content/projects/` — if the slug exists, append
  a clarifier (e.g. `-v2`, `-2026`).

Show the user the inferred slug; ask only if they want to change it.

---

## Step 3 — Re-read the schema card

Open `../schemas/project.fields.md`. Walk the REQUIRED tier and confirm
every field has a value. If anything is `undefined` or empty, infer or
prompt — do not write the file with a missing required field.

---

## Step 4 — Write the draft file

Write the draft to `src/content/projects/<id>.json` directly. Yes, on disk
before the user sees it. (The fix-anything loop edits in place, so this
is faster than passing the JSON through chat.)

Include only fields you actually have values for — don't write empty
strings or `null`. Skip OPTIONAL fields entirely at this stage.

---

## Step 5 — Show the draft

Cat the file back with `Read` and present a compact summary in the chat:

```
Drafted src/content/projects/<id>.json:
  name:        <name>
  category:    <category>  ← inferred
  status:      <status>
  technologies: <list>
  dateCompleted: <YYYY-MM>
  hero:        <path or URL or "(none yet)">
  links:       <count and types>
  featured:    <true/false>
```

---

## Step 6 — Multi-asset wiring (Viewfinder tabs)

The bentOS dashboard re-skins to a project on `/?project=<id>` and the
Viewfinder shows a tab per asset the project has. Ship this step well —
it's what makes project pages feel rich vs. text-only.

If Branch A's auto-scrape (Step 1.10) found any candidates, **propose them
inline** instead of asking. Otherwise ask:

```
Q: "Which Viewfinder tabs does this project have?"
header: "Viewfinder"
options: (multi-select)
  - 3D model (.glb / .stl)
  - Video (YouTube / file)
  - PDF document
  - Embedded website / live demo
  - Game embed (itch / Unity WebGL)
  - Map locations
```

For each chosen tab, run the matching sub-flow below. **Save files to disk
before referencing them in JSON** — the validator runs after sync, and a
dangling path will fail it.

### 3D model sub-flow

1. Ask source:
   ```
   Q: "Where's the 3D model coming from?"
   header: "3D source"
   options:
     - Local file path
     - URL (GitHub raw, CDN, etc.)
     - Cancel — skip 3D
   ```
2. Validate format: only `.glb`, `.gltf`, `.stl` work in `Model3DViewer`.
3. Local file: prefer
   `npm run add:model -- --project "<id>" --src "<path>" --sync --json`.
   URL: download to a temp local file first, then run the same command.
4. The script sets `links.modelPath = "/models/<id>/main.<ext>"`
   (public-rooted, no `/public/` prefix).
5. **Don't ship URDF/MJCF mesh bundles as-is.** Many robotics repos split
   meshes per link (e.g. `link0.stl`, `link1.stl`, …). The viewer loads one
   file, so either compose a unified GLB locally (out of scope for this
   skill — defer to Kevin) or skip 3D for this project and flag it in the
   final report as `"3D deferred — multi-mesh bundle in repo"`.

### Video sub-flow

1. Ask source:
   ```
   Q: "Where's the video?"
   header: "Video source"
   options:
     - YouTube URL
     - Vimeo URL
     - Local file (mp4)
     - Cancel
   ```
2. YouTube/Vimeo: keep the URL as-is. `VideoViewer` accepts the share URL
   and embeds the player.
3. Local file: copy to `public/projects/<id>/<name>.mp4`, reference as
   `/projects/<id>/<name>.mp4`.
4. Set `media.video = <url-or-path>`.

### PDF sub-flow

1. Ask for the local file path (PDFs over ~10 MB are usually scans — warn
   but proceed).
2. `cp <path> public/projects/<id>/<filename>.pdf`.
3. Set `media.pdf = "/projects/<id>/<filename>.pdf"`.

### Website sub-flow

1. Ask for the URL (must be HTTPS — Chrome blocks mixed content).
2. `WebFetch` it once to confirm it's reachable and doesn't return
   `X-Frame-Options: DENY` (which would prevent embedding).
3. Set `media.website = <url>`.

### Game sub-flow

1. Ask type:
   ```
   Q: "What kind of game embed?"
   header: "Game type"
   options:
     - itch.io
     - Unity WebGL
     - Cancel
   ```
2. Ask for URL.
3. **itch.io caveat**: only `https://*.itch.io/embed/<id>` URLs iframe
   reliably. Profile URLs (`https://<user>.itch.io/`) and game-page URLs
   (`https://<user>.itch.io/<slug>`) fall through to GameViewer's "Open
   game in new tab" CTA. Set the URL anyway — the CTA is still useful UX.
4. Set `media.game = { type: <type>, url: <url> }`.

### Map sub-flow

1. List available location IDs from `src/lib/map-data.ts`:
   ```bash
   node -e "const m = require('./src/lib/map-data.ts'); console.log(Object.keys(m.MAP_LOCATIONS).join('\n'));"
   ```
   (If TS-require fails, grep: `grep -oE '"id": "[a-z-]+"' src/lib/map-data.ts`.)
2. Show the user the available IDs and ask for a comma-separated subset
   (free text — too many for `AskUserQuestion`'s 4-cap).
3. Validate every supplied ID exists in `MAP_LOCATIONS`. If any don't,
   show the user the list of unknowns and re-prompt.
4. Set `media.map.locations = [<id1>, <id2>, …]`. Optionally also
   `media.map.highlightedIds` if the user wants one or two emphasized.
5. **Kevin's preference (May 2026)**: the map is for life-experience
   locations, not per-project pins. Only wire `media.map` if the user
   explicitly asks — otherwise leave the project to fall back to the
   default `getAllMapLocations()`.

### After all sub-flows

`Edit` the JSON to add the new fields. Don't write empty objects — if
`media.images` was the only field and now it's also `media.video`, the
final `media` should have both, not three half-filled blocks.

Loop back to Step 7 (fix-anything) so the user can review the new state.

---

## Step 7 — Fix-anything loop

```
Q: "Anything to fix before I sync?"
header: "Review"
options:
  - Ship it as-is
  - Edit specific fields
  - Re-do the Viewfinder tabs (Step 6)
  - Re-do from scratch
```

- **"Edit specific fields"** → follow up with a multi-select `AskUserQuestion`
  asking which group of fields to edit. The 4-option cap means we batch:
  ```
  Q: "Which fields need fixing?"
  header: "Edit"
  options: (multi-select)
    - Identity (name, id, shortDescription)
    - Classification (category, status, featured, dateCompleted)
    - Tech + description (technologies, description)
    - Links (github, liveDemo, docs)
  ```
  For each group the user picks, walk its fields one at a time with the
  appropriate input style (enum buttons for `status`/`category`/`featured`,
  free text for descriptions, etc.). After all edits, `Edit` the JSON file
  and loop back to Step 7.
- **"Re-do the Viewfinder tabs"** → return to Step 6.
- **"Re-do from scratch"** → delete the file, return to Step 1.
- **"Ship it as-is"** → fall through to Step 8.

### Category special case

If `category` was inferred and the user wants to change it, the 8 options
exceed the `AskUserQuestion` 4-cap. Do this two-tier prompt:

```
Q1: "Which bucket?"
header: "Category"
options:
  - Hardware / Robotics
  - Software / AI
  - Games / VR-AR
  - Accessibility / Hackathon
```

Then the second question narrows within the picked bucket (each bucket has
≤2 specific values, well within the cap).

---

## Step 8 — Sync and test

Run:

```bash
npm run sync && npm test
```

If either fails, surface the full error output to the user verbatim. Do
**not** auto-repair. Ask via `AskUserQuestion`:

```
Q: "Sync/tests failed. What do you want to do?"
header: "Failure"
options:
  - Fix the field it's complaining about
  - Show me the error in more detail
  - Abandon (delete the draft file)
  - I'll fix it manually
```

If the user picks "Fix", parse the error to identify the field, then loop
back to Step 7 with that field pre-selected for editing.

---

## Step 9 — Commit message

Draft a one-line imperative commit message. Examples:

- `Add Expressive AI Robot Head project`
- `Add VR Haptic Gloves project`
- `Add bentOS portfolio site to projects`

**No AI attribution trailers, no robot emojis, no Co-Authored-By lines.**
This is a hard rule from the repo's CLAUDE.md.

```
Q: "Commit message: '<draft>' — ship?"
header: "Commit"
options:
  - Ship
  - Edit the message
  - Hold off (don't commit)
```

---

## Step 10 — Commit and push

```bash
git add src/content/projects/<id>.json \
        src/content/projects.generated.json \
        src/content/talking-points.generated.json \
        public/projects/<id>/    # if hero/media were saved locally
        public/models/<id>/      # if a 3D model was saved
git commit -m "<message>"
git push origin main
```

Do not use `git add .` or `git add -A`. Always name the files explicitly so
you don't ship someone else's dirty working tree.

---

## Step 11 — Report back

Print to the user:

- ✅ What was added (one line)
- Commit SHA (short)
- Live URL: `https://kevinjiang.dev` (or read from `src/lib/site-config.ts`)
- "Vercel will deploy in ~1-2 min"

Done.

---

## Refusal cases

Stop and refuse (politely) if asked to commit:

- Secrets, API keys, `.env` content
- Employer NDA / proprietary metrics
- Grades, transcripts
- Content the user does not own (someone else's photo, copyrighted model)

When in doubt, ask the user explicitly whether the content is shareable on
a public site before writing.

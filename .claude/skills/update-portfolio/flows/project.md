# Flow: add a project

Adding a project to bentosite. This flow is **deterministic** — follow the
numbered steps in order. Use `AskUserQuestion` at every decision point
listed; do not improvise alternative branching.

**Before you start**, re-read `schemas/project.fields.md` (sibling directory).
That card lists every field, required tier, and enum values. Keep it in mind
through the whole flow.

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

## Step 6 — Fix-anything loop

```
Q: "Anything to fix before I sync?"
header: "Review"
options:
  - Ship it as-is
  - Edit specific fields
  - Add optional media (hero / 3D model / video / demo URL)
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
  and loop back to Step 6.
- **"Add optional media"** → multi-select `AskUserQuestion` listing OPTIONAL
  fields (hero image, 3D model, video URL, live demo URL, docs URL, PDF,
  additional screenshots). For each chosen, prompt for source. Save files to
  the right `public/projects/<id>/` or `public/models/` location. `Edit`
  the JSON file. Loop back to Step 6.
- **"Re-do from scratch"** → delete the file, return to Step 1.
- **"Ship it as-is"** → fall through to Step 7.

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

## Step 7 — Sync and test

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
back to Step 6 with that field pre-selected for editing.

---

## Step 8 — Commit message

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

## Step 9 — Commit and push

```bash
git add src/content/projects/<id>.json \
        src/content/projects.generated.json \
        src/content/talking-points.generated.json \
        public/projects/<id>/    # if hero/media were saved locally
git commit -m "<message>"
git push origin main
```

Do not use `git add .` or `git add -A`. Always name the files explicitly so
you don't ship someone else's dirty working tree.

---

## Step 10 — Report back

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

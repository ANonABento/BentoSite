# Portfolio Content Playbook

Audience: any agent (Claude Code, choomfie, hermes, future-Kevin) updating
portfolio content in this repo. **Code changes** belong in `CLAUDE.md`, not here.

## Two ways in

**Visually**: `npm run dev`, then open <http://localhost:3000/studio>. The
Studio edits every file listed below through forms — including image upload,
drag-to-reorder, and a Sync/Commit flow. It only exists in development.

**By hand or from an agent**: the table below, or the `npm run add:*` CLIs.
Both paths write through the same validator, so neither can produce content the
other would reject.

## TL;DR

| Want to... | Touch this |
|---|---|
| Add a new project | `src/content/projects/<id>.json` |
| Add a new photo | `public/photos/<file>.jpg` + `public/photos/<file>.json` sidecar |
| Add an FAQ / talking point for the chat assistant | `src/content/talking-points/<id>.json` |
| Update bio, skills, experience, education, contact | `src/content/portfolio.json` |
| Swap the resume link | `RESUME_URL` in `src/lib/constants.ts` |

After any change: `npm run sync && npm test` then commit + push to `main`.
Vercel auto-deploys.

## Files you must never edit by hand

- `src/content/projects.generated.json` — built from `src/content/projects/*.json`
- `src/content/talking-points.generated.json` — built from `src/content/talking-points/*.json`
- `public/photos/manifest.json` — built from `public/photos/*` images + sidecars

These regenerate on `npm run sync` (and on `npm run dev` / `npm run build`).
If you find yourself editing them, you're doing it wrong.

## Adding a project

1. Pick an `id` — kebab-case, e.g. `expressive-ai-robot-head`. The filename
   must match: `src/content/projects/<id>.json` and the `"id"` field inside.
2. Use this shape (only `id`, `name`, `shortDescription`, `category`,
   `status`, `technologies` are required):

   ```json
   {
     "id": "my-project",
     "name": "My Project",
     "shortDescription": "One-line card description (used by featured grid).",
     "description": "Longer prose for the project modal.",
     "category": "Robotics",
     "status": "Completed",
     "technologies": ["Python", "ROS2"],
     "featured": false,
     "dateCompleted": "2026-05",
     "links": {
       "github": "https://github.com/ANonABento/foo",
       "liveDemo": "https://...",
       "modelPath": "/models/foo.glb",
       "docs": "https://..."
     },
     "media": {
       "featuredImage": "/projects/foo/hero.png",
       "images": ["/projects/foo/1.png", "/projects/foo/2.png"],
       "video": "https://youtube.com/watch?v=...",
       "website": "https://...",
       "pdf": "/projects/foo/report.pdf",
       "game": { "type": "itch", "url": "https://..." }
     }
   }
   ```

3. `status` must be one of: `Completed`, `In Progress`, `Archived`.
4. `dateCompleted` is `YYYY-MM` or `YYYY`. Drives sort order (newest first).
5. `featured: true` puts it on the dashboard featured grid.
6. `order` (optional integer) pins the project's place in the archive. Projects
   with an `order` sort first, lowest first; everything else follows
   newest-first. Set it by dragging the Studio's project list rather than by
   hand — the Studio renumbers the whole list in one pass.
7. Image paths under `media.images` etc. are public-rooted (`/projects/...`),
   not `/public/projects/...`.
8. Run `npm run sync:projects` to regenerate the bundle.

### From a GitHub repo URL

1. Use `gh repo view <owner>/<repo> --json name,description,url,languages` if
   `gh` is available; otherwise WebFetch the README.
2. Infer: name, shortDescription, technologies, category.
3. Hero image: look for `docs/`, `assets/`, `images/`, `screenshots/` folders.
   Download the most representative image to `public/projects/<id>/hero.png` and
   reference under `media.featuredImage`.
4. Default `category` based on tech: ROS2/CAD → `Robotics`, Unity → `Games`,
   Altium/STM32 → `Hardware`, LLM/PyTorch → `AI & Robotics`, web → `Software`,
   AR/VR → `VR/AR`, accessibility → `Accessibility`, hackathon win → `Hackathon`.
5. Always include `links.github` pointing to the repo URL.

### From a Devpost link

1. WebFetch the devpost page.
2. Extract: project name (h1), tagline (`shortDescription`), built-with section
   (`technologies`), inspiration/what-it-does (combine into `description`).
3. Hero image is usually the first image after the title — download to
   `public/projects/<id>/hero.png`.
4. Set `category: "Hackathon"` unless tech strongly implies another bucket.
5. Add the devpost URL as `links.docs`.

## Adding a photo

1. Drop the image at `public/photos/<file>.jpg` (or `.png`/`.webp`).
2. Drop a sidecar at `public/photos/<file>.json` with all four fields:

   ```json
   {
     "title": "Photo Title",
     "location": "City",
     "year": "2026",
     "alt": "Description for screen readers and SEO."
   }
   ```

3. Run `npm run sync:photos`. Dimensions auto-detected via `sharp`. Sort order
   is newest year first.
4. **Never** hand-edit `public/photos/manifest.json`.

If a photo has no sidecar, `sync:photos` skips it with a warning. That's the
signal to either add the sidecar or delete the orphan image.

## Adding a talking point (chat assistant)

The chat assistant only answers from grounded portfolio context. Talking points
let you teach it things that aren't naturally a project (availability,
philosophy, specific FAQs).

1. Create `src/content/talking-points/<id>.json`:

   ```json
   {
     "id": "graduating-2027",
     "title": "Graduating Spring 2027",
     "content": "Kevin graduates with a BASc in Computer Engineering from the University of Waterloo in Spring 2027. He is open to new-grad robotics and AI/ML conversations starting summer 2026.",
     "keywords": ["graduating", "graduation", "new grad", "2027", "spring"]
   }
   ```

2. `keywords` boost retrieval — include synonyms a user might ask in.
3. Run `npm run sync:projects` (yes, that builds talking points too).

## Updating bio / skills / experience / education

Edit `src/content/portfolio.json` directly. Schema is enforced by
`npm run validate:content`. Do not add a `projects` field — it lives elsewhere
now and the validator will reject it.

For experience and education, `coordinates: { lat, lng }` are used by the
globe in `/scrollable`. Look up the city's coordinates if adding a new entry.

## Swapping the resume link

Edit `RESUME_URL` in `src/lib/constants.ts`. Header, dashboard, scrollable
hero, and footer all read from this constant. Don't hard-code resume paths
anywhere else.

## Validate and ship

Always run before committing:

```bash
npm run sync          # regenerates projects + photos + validates portfolio
npm test              # vitest unit tests
```

If anything fails, fix it before committing. Do not skip hooks.

Commit message style: imperative, one short summary line, no AI attribution
(no "Generated with Claude Code", no Co-Authored-By trailers, no robot emojis).
Examples:

- `Add Robotic Arm Puppeteer project`
- `Add 3 photos from Tokyo trip`
- `Update Hamming AI period`
- `Refresh chat talking points for new-grad search`

Push to `main`. Vercel deploys automatically.

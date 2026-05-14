---
name: update-portfolio
description: Update Kevin's portfolio at bentosite — add a project (from GitHub repo, Devpost link, or freeform), add photos with metadata, add chat-assistant talking points, or update bio/experience/education. TRIGGER when the user says "add this to my portfolio", "put this on the site", shares a GitHub/Devpost URL with intent to feature, attaches an image meant to ship, says "update my bio/experience", "tell the chatbot about X", or "swap my resume". SKIP for code review, design changes, or questions about how the site works (those are CLAUDE.md territory).
---

# update-portfolio

You are updating bentosite — Kevin Jiang's portfolio. Content updates only;
hands off the code (theme, components, build).

## First thing, every time

Read `src/content/AGENTS.md`. It is the source of truth for file shapes,
required fields, validation, commit style. This skill is the high-level
workflow; AGENTS.md is the reference. Do not skip it.

## Identify the request

Ask yourself which bucket the user is in. If unclear, ask one short
clarifying question — don't guess.

| Signal | Bucket |
|---|---|
| GitHub URL, "this repo", `gh repo view`-able | **Add project from repo** |
| Devpost / Devfolio / hackathon link | **Add project from devpost** |
| Image attachment + "photo" / "shot" / "from <trip>" | **Add photo** |
| "Add a project" with no link, freeform description | **Add project (freeform)** |
| "Tell the assistant about", "make sure the chat knows", FAQ-style | **Add talking point** |
| "Update my bio/experience/skills/education" | **Edit `portfolio.json`** |
| "New resume", "swap resume", "use this resume URL" | **Update `RESUME_URL`** |

## Workflows

### Add project from a GitHub repo

1. Get repo metadata. Prefer `gh repo view <owner>/<repo> --json
   name,description,url,homepageUrl,languages,topics,stargazerCount`
   when `gh` is authenticated; fall back to WebFetch on the repo page.
2. WebFetch the README to extract a longer description and screenshots.
3. Pick an `id`: kebab-case slug from the repo name (or whatever the user
   suggests).
4. Hero image: scan `docs/`, `assets/`, `images/`, `screenshots/`, `media/`
   in the repo for a representative image. Use the GitHub raw URL
   (`https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>`) — or
   if the user wants it self-hosted, save to
   `public/projects/<id>/hero.png` and reference as `/projects/<id>/hero.png`.
5. Map languages → `technologies` (cap at ~8 most relevant). Pick a
   `category` per AGENTS.md heuristics.
6. Write `src/content/projects/<id>.json`. Include `links.github`.
7. Run `npm run sync` then `npm test`. Fix anything that fails.
8. Commit + push (see "Shipping" below).

### Add project from a Devpost link

1. WebFetch the URL.
2. Extract: name (h1), tagline (`shortDescription`), built-with chips
   (`technologies`), inspiration / what-it-does / how-we-built-it (combine
   into `description`).
3. Hero image is usually the first image after the title. Either reference
   the devpost-hosted URL or download to `public/projects/<id>/hero.png`.
4. `category: "Hackathon"` unless the tech strongly implies another bucket.
5. Add the devpost URL as `links.docs` and any github link from the page as
   `links.github`.
6. Write the file → `npm run sync && npm test` → commit + push.

### Add project (freeform, no link)

1. Confirm the minimum fields with the user if missing: name, one-line
   description, category, technologies, completion date.
2. Write the file → `npm run sync && npm test` → commit + push.

### Add a photo

1. Save the image to `public/photos/<slug>.jpg` (or `.png`/`.webp`). Slug
   the filename: lowercase, hyphens, no spaces.
2. If the user gave you the image as an attachment / file path, copy it
   into place. Verify the file exists with `ls`.
3. Write the sidecar at `public/photos/<slug>.json` with all four fields:
   `title`, `location`, `year`, `alt`. Ask for any you don't have — don't
   make them up. `alt` should describe what's visible for accessibility, not
   restate the title.
4. Run `npm run sync:photos`. It auto-detects width/height via `sharp`.
5. `npm test` → commit + push.

### Add a talking point

1. Write `src/content/talking-points/<id>.json` with `id`, `title`,
   `content`, and `keywords` (synonyms users might ask in).
2. Keep `content` factual and grounded. The assistant refuses to invent;
   so should you.
3. `npm run sync && npm test` → commit + push.

### Update bio / experience / education

1. Edit `src/content/portfolio.json` directly.
2. For experience/education entries that need a globe pin, look up
   `coordinates: { lat, lng }` for the city.
3. `npm run validate:content && npm test` → commit + push.

### Swap resume

1. Edit `RESUME_URL` in `src/lib/constants.ts`.
2. `npm test` → commit + push. (No content sync needed.)

## Shipping

Always before committing:

```bash
npm run sync && npm test
```

Commit message: imperative, one short summary line, **no AI attribution
trailers, no robot emojis, no "Generated with Claude Code"**. Push to `main`.
Vercel auto-deploys.

After pushing, report back to the caller (e.g., choomfie/Discord):
- What was added or changed (1 line)
- The commit SHA
- "Vercel will deploy in ~1-2 min — check https://kevinjiang.dev"
  (or whatever the live URL is — check `lib/site-config.ts` if unsure)

## Edge cases and refusals

- **No write access / dirty git state:** stop. Report what you would have
  done and ask the user how to proceed. Don't try to stash or force.
- **Missing required field you can't infer (e.g., photo location):** ask. Don't
  invent. The chat assistant is grounded; portfolio data should be too.
- **User asks you to commit secrets, private metrics, employer NDA content,
  or grades:** refuse. The portfolio is public.
- **Photo with no sidecar gets skipped by `sync:photos`:** that's the
  intended behavior. Either add the sidecar or delete the orphan image.
- **Generated file shows up in `git diff` but you didn't change source files:**
  it means a previous edit drifted. Run `npm run sync` to refresh, then
  commit the regenerated file alongside source edits.

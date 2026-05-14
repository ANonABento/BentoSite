---
name: update-portfolio
description: Update Kevin's portfolio at bentosite — add a project (from GitHub repo, Devpost link, or freeform), add photos with metadata, add chat-assistant talking points, or update bio/experience/education. TRIGGER when the user says "add this to my portfolio", "put this on the site", shares a GitHub/Devpost URL with intent to feature, attaches an image meant to ship, says "update my bio/experience", "tell the chatbot about X", or "swap my resume". SKIP for code review, design changes, or questions about how the site works (those are CLAUDE.md territory).
---

# update-portfolio

Update content on bentosite (Kevin Jiang's portfolio). **Content updates only**
— hands off code (theme, components, build).

This skill is a **router**. The real instructions live in `flows/<type>.md`,
and the field references live in `schemas/<type>.fields.md`. The flow files
are deterministic numbered checklists; follow them in order.

## Step 0 — Always read AGENTS.md

Before anything else, `Read` `src/content/AGENTS.md`. It's the
project-internal playbook for content files: file shapes, validation rules,
commit style. The skill is the workflow; AGENTS.md is the canonical reference.

## Step 1 — Identify the type

What is the user adding or changing? If their message names it
unambiguously, skip the question and go to Step 2.

Otherwise ask:

```
Q: "What are you adding to the portfolio?"
header: "Type"
options:
  - Project (from GitHub repo, Devpost, or freeform)
  - Photo (image + sidecar)
  - Experience / education / bio (portfolio.json)
  - Talking point or resume URL
```

Quick triage hints from the user's message:

| User said... | Type |
|---|---|
| `github.com/...`, `gh repo`, "this repo" | Project |
| `devpost.com/...`, "hackathon project" | Project |
| Attached image, "photo from", "shot from <trip>" | Photo |
| "update my bio", "add experience", "I'm now at <company>" | Experience |
| "tell the chatbot about X", "make sure the assistant knows" | Talking point |
| "new resume", "swap my resume", "use this PDF" | Resume URL |

## Step 2 — Load and follow the matching flow file

Use `Read` on exactly one of:

- `flows/project.md`
- `flows/photo.md`
- `flows/experience.md`
- `flows/talking-point.md`

Then follow its numbered steps in order. Do not deviate from the flow.
Every `AskUserQuestion` call listed in the flow must actually fire —
don't skip prompts because you think you know the answer. The whole
point of the deterministic flow is to ensure nothing is silently dropped.

The flow file will tell you when to re-read its schema sibling
(e.g. `schemas/project.fields.md`). Don't read schema files preemptively —
they're context-heavy reference cards.

## Universal rules

These apply to every flow; they're called out here so the per-type flows
don't have to repeat them.

### Validation gate

Before any commit, the flow runs `npm run sync && npm test` (or
`npm run validate:content && npm test` for portfolio.json edits). If
either fails, surface the error verbatim and ask the user how to proceed
via `AskUserQuestion`. Do not silently auto-repair.

### Commit style

- Imperative, one short line. Examples in each flow.
- **No AI attribution trailers, no robot emojis, no Co-Authored-By lines.**
  This is a hard rule from the repo's `CLAUDE.md`.
- Never `git add .` or `git add -A`. Always name the files explicitly so
  unrelated working-tree changes don't ship.
- Never `--no-verify`, never `--amend` a published commit. Create a new
  commit if the previous one had a problem.

### Refusals

Stop and refuse if asked to commit:

- Secrets, API keys, `.env` contents
- Employer NDA / proprietary metrics
- Grades, GPA, transcripts (unless explicitly OK'd for the public site)
- Content the user does not own or have rights to publish
- Faces of identifiable people in photos without explicit OK

When in doubt, ask before writing.

### Dirty working tree

Before starting any flow, `git status`. If there are uncommitted changes
unrelated to the current task, stop and ask the user how to proceed —
don't try to stash or force, and don't commit someone else's work along
with the change.

### Reporting back

Every flow ends with a one-message report to the user (or upstream caller,
e.g. choomfie / Discord):

- ✅ One line: what was added or changed
- Commit SHA (short)
- The relevant live URL — usually `https://kevinjiang.dev`; verify against
  `src/lib/site-config.ts`'s `siteConfig.url` if unsure
- "Vercel will deploy in ~1-2 min"

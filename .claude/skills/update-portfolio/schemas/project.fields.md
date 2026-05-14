# Project field reference

**Re-read this file every time you draft `src/content/projects/<id>.json`.**
Walk the list top-to-bottom; for each field, either infer from source, set a
sensible default, or flag it in the "fix anything?" preview. Nothing in the
REQUIRED tier may be silently dropped or guessed.

File path: `src/content/projects/<id>.json` (the `id` field must equal the
filename slug). Companion assets live under `public/projects/<id>/`.

---

## REQUIRED tier — every project must have these

| Field | Type | Notes |
|---|---|---|
| `id` | string | kebab-case slug; must match filename. e.g. `expressive-ai-robot-head` |
| `name` | string | Display name. e.g. `"Expressive AI Robot Head"` |
| `shortDescription` | string | One sentence, used in card grid. Cap ~140 chars. |
| `category` | enum | See **Category enum** below |
| `status` | enum | One of: `"Completed"`, `"In Progress"`, `"Archived"` |
| `technologies` | string[] | Cap ~8 most relevant. e.g. `["Python", "ROS2", "PyTorch"]` |
| `dateCompleted` | string | `YYYY-MM` or `YYYY`. Drives sort order. For "In Progress", use the current month. |

### Category enum (8 values — pick exactly one)

`Robotics`, `AI & Robotics`, `Hardware`, `Software`, `Games`, `VR/AR`,
`Accessibility`, `Hackathon`

**Inference heuristics** (use to pre-fill, then offer to change in preview):
- ROS2 / CAD / motors / servos → `Robotics`
- LLM / Whisper / PyTorch / agents → `AI & Robotics`
- PCB / STM32 / ESP32 / Altium → `Hardware`
- Unity / Godot / game engine → `Games`
- Web / Next.js / mobile app (non-hardware) → `Software`
- VR / AR / Quest / headset → `VR/AR`
- Accessible / assistive / a11y focus → `Accessibility`
- Hackathon win or Devpost source → `Hackathon` (overrides the others)

Because there are 8 options and `AskUserQuestion` caps at 4: **infer first,
show the inferred value in the preview, and only ask the user to pick if
they reject it**. If they reject, offer a two-tier follow-up:
1. First question: `Hardware/Robotics`, `Software/AI`, `Games/VR`, `Other`
2. Narrow from the chosen bucket.

---

## NEAR-REQUIRED tier — offer these explicitly in the "fix anything?" loop

| Field | Type | Notes |
|---|---|---|
| `description` | string | Long prose for the project modal. 2-4 sentences. |
| `featured` | boolean | `true` puts it on the dashboard featured grid. Default `false` unless user said it's a flagship. |
| `links.github` | url | Almost always present. Default from source URL if known. |
| `media.featuredImage` | path | Hero image for the card. `/projects/<id>/hero.png` (public-rooted, no `/public/` prefix). |

---

## OPTIONAL tier — only ask if the user signals they want it

| Field | Type | When to ask |
|---|---|---|
| `links.liveDemo` | url | Hosted demo / deployment URL |
| `links.docs` | url | Devpost / external write-up / longer docs |
| `links.modelPath` | path | If they're attaching a `.glb`/`.stl`. Save under `/models/<id>.glb` |
| `media.images` | path[] | Additional screenshots beyond the hero |
| `media.video` | url | YouTube / Vimeo embed |
| `media.website` | url | Used by the Viewfinder website tab |
| `media.pdf` | path | Report PDF; save under `/projects/<id>/<file>.pdf` |
| `media.game` | object | `{ type: "itch", url: "..." }` — only for playable embeds |

---

## File path conventions

- Public-rooted, **never** prefixed with `/public/`:
  - ✅ `/projects/<id>/hero.png`
  - ❌ `/public/projects/<id>/hero.png`
- Hero images: copy the file to `public/projects/<id>/hero.png` before
  referencing.
- 3D models: copy to `public/models/<id>.glb` (or `.stl`); reference as
  `/models/<id>.glb`.
- If the user only has a remote URL (e.g. GitHub raw, devpost CDN), it's
  acceptable to reference it directly — but prefer local copies for
  longevity.

---

## What never goes in this file

- Generated bundle (`src/content/projects.generated.json`) — rebuilt by
  `npm run sync:projects`. Don't hand-edit.
- Secrets, NDA content, employer-proprietary metrics, grades. Refuse if asked.
- Hand-waved placeholder data ("TBD", "lorem ipsum"). If you don't know it,
  ask. The chat assistant is grounded; the data feeding it must be too.

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

These fields drive the **Viewfinder tabs** on `/?project=<id>`. Each
populated field surfaces one tab. See `flows/project.md` Step 6 for the
per-asset sub-flows (where files get saved, validations, fallbacks).

| Field | Type | When to ask | What it does in the Viewfinder |
|---|---|---|---|
| `links.liveDemo` | url | Hosted demo / deployment URL | Surfaces a "Visit demo" link on the card; not a Viewfinder tab on its own |
| `links.docs` | url | Devpost / external write-up / longer docs | Card-level link |
| `links.modelPath` | path | They have a `.glb`/`.gltf`/`.stl` of the project. Save under `public/models/<id>/main.<ext>`. Reference as `/models/<id>/main.<ext>`. **Don't** ship multi-mesh URDF/MJCF bundles — the viewer loads one file. | `3D` tab — loaded by `Model3DViewer` with LOD + FPS-aware perf |
| `media.images` | path[] | Additional screenshots beyond the hero. Save under `public/projects/<id>/`. | `IMG` tab — gallery viewer |
| `media.video` | url | YouTube / Vimeo URL (use the share link, not the iframe-embed URL — `VideoViewer` handles both), or a local `.mp4` under `public/projects/<id>/`. | `VID` tab — embedded player |
| `media.website` | url | A live URL the Viewfinder can iframe. HTTPS only; sites with `X-Frame-Options: DENY` won't load — surface a "Open in tab" CTA in those cases. | `WEB` tab — iframe |
| `media.pdf` | path | Report PDF, saved under `public/projects/<id>/<file>.pdf`. | `PDF` tab — PDF.js viewer |
| `media.game` | object | `{ type: "itch" \| "unity-webgl", url }`. **itch.io**: only `*.itch.io/embed/<id>` URLs iframe; profile and game-page URLs fall through to a "Open game" CTA. Set the URL anyway — the CTA is still useful. | `PLAY` tab — game iframe or CTA |
| `media.map` | object | `{ locations: string[], highlightedIds?: string[] }` where each entry is a key from `src/lib/map-data.ts`. **Kevin's standing preference (May 2026)**: the map is for life-experience locations, not per-project pins — leave this unset unless explicitly asked. | `MAP` tab — globe with dots |

---

## File path conventions

- Public-rooted, **never** prefixed with `/public/`:
  - ✅ `/projects/<id>/hero.png`
  - ❌ `/public/projects/<id>/hero.png`
- Hero images: copy to `public/projects/<id>/hero.png`.
- 3D models: copy to `public/models/<id>/main.<ext>` (note the
  per-project sub-directory — a single project can have helper meshes
  alongside `main`). Reference as `/models/<id>/main.<ext>`.
- Videos / PDFs / additional screenshots: all under
  `public/projects/<id>/`. Use lowercase, hyphenated filenames.
- If the user only has a remote URL (e.g. GitHub raw, devpost CDN), it's
  acceptable to reference it directly — but prefer local copies for
  longevity. Remote-only references should be flagged in the final
  report so they can be backfilled later.

---

## What never goes in this file

- Generated bundle (`src/content/projects.generated.json`) — rebuilt by
  `npm run sync:projects`. Don't hand-edit.
- Secrets, NDA content, employer-proprietary metrics, grades. Refuse if asked.
- Hand-waved placeholder data ("TBD", "lorem ipsum"). If you don't know it,
  ask. The chat assistant is grounded; the data feeding it must be too.

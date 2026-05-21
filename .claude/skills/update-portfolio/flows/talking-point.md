# Flow: add a talking point OR swap the resume URL

Two tiny related operations bundled together. Both ship in a one-line
commit. No schema card needed — the shapes are small enough to live here.

---

## Step 0 — Which one?

```
Q: "What are we doing?"
header: "Action"
options:
  - Add a chat-assistant talking point
  - Swap the resume URL
```

Branch to the matching sub-flow.

---

## Sub-flow A — Add a talking point

The chat assistant only answers from grounded portfolio content. Talking
points are the lever for teaching it things that aren't a project (FAQs,
availability, philosophy, "how does this site work?", etc.).

### Scripted fast path

If you already have `title`, factual `content`, and `keywords`, use:

```bash
npm run add:talking-point -- \
  --title "<title>" \
  --content "<content>" \
  --keywords "<comma,separated,phrases>" \
  --sync \
  --json
```

Use `--id <slug>` for a custom id, `--dry-run --json` for preview, and
`--overwrite` only for intentional replacement. After it succeeds, run
`npm test`, then commit the file paths reported by the script.

### A1. Required fields

All four are required:

| Field | Notes |
|---|---|
| `id` | kebab-case slug, unique among `src/content/talking-points/*.json` |
| `title` | Short display title; the assistant references this when citing the source |
| `content` | The actual prose the assistant draws from. Multi-paragraph OK; use `\n\n` between paragraphs in the JSON string. **Must be factual** — the assistant will quote from this. |
| `keywords` | string[] — synonyms / phrases a user might ask in. Boost retrieval. Cap ~12. |

### A2. Prompt the user

Ask in this order. Free text for the first three, free text comma-separated
for keywords.

1. **Title** — "What's this talking point called?"
2. **Content** — "What should the assistant know? (Be specific; it'll quote
   from this.)"
3. **Keywords** — "What words/phrases might someone ask using? (comma-separated)"

Infer the `id` from the title (kebab-case slug). Verify uniqueness:
`ls src/content/talking-points/`.

### A3. Write the draft

Write to `src/content/talking-points/<id>.json`:

```json
{
  "id": "<id>",
  "title": "<title>",
  "content": "<content with \\n\\n for paragraphs>",
  "keywords": ["...", "..."]
}
```

### A4. Show the draft

Cat back the file in chat.

### A5. Fix-anything loop

```
Q: "Anything to fix?"
header: "Review"
options:
  - Ship it
  - Edit title
  - Edit content
  - Edit keywords
```

Loop until "Ship it".

### A6. Sync and test

```bash
npm run sync && npm test
```

`sync` regenerates `src/content/talking-points.generated.json`. Surface
errors verbatim; ask the user how to recover.

### A7. Commit and push

Commit message examples:

- `Add availability talking point`
- `Add chat-assistant architecture talking point`
- `Add new-grad search talking point`

```
Q: "Commit message: '<draft>' — ship?"
header: "Commit"
options:
  - Ship
  - Edit message
  - Hold off
```

```bash
git add src/content/talking-points/<id>.json \
        src/content/talking-points.generated.json
git commit -m "<message>"
git push origin main
```

### A8. Report

- ✅ Talking point added
- Commit SHA
- "Vercel will deploy in ~1-2 min — try asking the chat on https://kevinjiang.dev"

---

## Sub-flow B — Swap the resume URL

One constant edit. Header, dashboard, scrollable hero, and footer all read
from `RESUME_URL` in `src/lib/constants.ts`.

### B1. Ask for the URL

Free text. The current URL is the canonical Google Doc PDF export. The
new one is usually another Google Doc export or a hosted PDF.

```
Q: "Paste the new resume URL:"
```

Validate it looks like a URL (starts with `https://`). Reject anything
that looks like a local path or a placeholder.

### B2. Confirm

```
Q: "Replace RESUME_URL with '<new_url>'?"
header: "Confirm"
options:
  - Yes, replace
  - No, let me re-paste
```

### B3. Edit the constant

Use `Edit` on `src/lib/constants.ts` to replace the value of `RESUME_URL`.
Do not touch any other constant.

### B4. Test

```bash
npm test
```

(No content sync needed — this is a code constant.) If tests fail, surface
output; the most likely cause is a constants-test that imports the URL
and asserts a pattern.

### B5. Commit and push

Commit message: `Update resume URL`.

```
Q: "Commit and push as 'Update resume URL'?"
header: "Commit"
options:
  - Ship
  - Edit message
  - Hold off
```

```bash
git add src/lib/constants.ts
git commit -m "Update resume URL"
git push origin main
```

### B6. Report

- ✅ Resume URL updated
- Commit SHA
- "Header, dashboard, and scrollable hero will all point at the new URL once Vercel deploys (~1-2 min)"

---

## Refusal cases

- Talking points: do not include unverified claims, salary specifics, NDA
  content, or grades. The assistant will quote from these verbatim.
- Resume URL: do not accept a URL the user obviously doesn't control
  (e.g. someone else's Google Doc). If unclear, ask.

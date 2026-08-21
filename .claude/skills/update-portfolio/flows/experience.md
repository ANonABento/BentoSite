# Flow: edit experience / education / bio

Editing `src/content/portfolio.json`. There's no separate file per entry —
everything lives in one JSON object. Re-read
`schemas/experience.fields.md` before drafting.

---

## Step 1 — Pick the section

```
Q: "What are you updating?"
header: "Section"
options:
  - Experience (new job / internship / research / project entry)
  - Education (new school)
  - Bio + personal info (name, title, about, contact)
  - Skills (hardware / software / tools arrays)
```

Branch to the matching sub-flow below.

---

## Sub-flow A — Add an experience entry

### A1. Required-fields prompt

Ask the user for the basics. Use free-text prompts (no enum needed for
most):

- Company / org name
- Role / title
- Period (e.g. "Dec 2025 - Present" or "Jun 2025 - Aug 2025")
- Location ("City, State/Region, Country")
- Brief description (1-3 sentences, what impact)
- Technologies used (comma-separated)

Then `AskUserQuestion` for the entry type:

```
Q: "What type of entry is this?"
header: "Type"
options:
  - work (full-time, part-time, contract)
  - research (lab, university research)
  - internship (co-op, summer intern)
  - project (volunteer, side project, club)
```

### A2. Coordinate lookup

Look up `{lat, lng}` for the city from training knowledge (or `WebFetch`
Wikipedia if uncertain). **Always confirm before writing.**

```
Q: "Coordinates for <City>: <lat>, <lng>. Use these?"
header: "Coords"
options:
  - Yes, use those
  - No, I'll give exact coords
  - Use metro area instead (privacy)
```

### A3. Pick an `id`

kebab-case from the company name. Verify uniqueness:
`grep '"id":' src/content/portfolio.json` to scan existing entries.

### A4. Draft and insert

Build the JSON entry object. `Edit` `src/content/portfolio.json` to
insert at the top of `experience[]` (newest first), unless the period
indicates older — in that case insert at the appropriate index.

### A5. Show the draft

Cat back the inserted entry only (not the whole file):

```
Inserted into experience[] at index 0:
  company: <company>
  role: <role>
  period: <period>
  location: <location>
  coords: <lat>, <lng>
  type: <type>
  technologies: <list>
  description: <description>
```

Then fall through to **Step 2 — Fix-anything loop** below.

---

## Sub-flow B — Add an education entry

Same as Sub-flow A but with education fields (`institution` instead of
`company`, `degree` instead of `role`, no `type` field, optional
`description`).

GPA: **never include** unless the user explicitly says it's OK to publish.
If they ask to include GPA, double-check by asking:

```
Q: "Publish GPA on the public site?"
header: "GPA"
options:
  - Yes, publish it
  - No, omit
```

---

## Sub-flow C — Edit bio + personal info

### C1. Pick which subsection

```
Q: "What part of personal info?"
header: "Subsection"
options:
  - Header (name, title, location)
  - About paragraph (the bio prose)
  - Contact (email, github, linkedin)
  - School / degree (in personal block — for header display)
```

### C2. Prompt for the new value(s)

Free text. For `about`, the user will probably paste multi-line — wrap
each paragraph break as `\n\n` (escaped) since it's a JSON string.

### C3. Edit the file

Use `Edit` on the specific field(s). Never rewrite the whole file —
preserve everything else.

### C4. Show what changed

Cat back just the diff:

```
Updated personal.title:
  before: "Robotics & Embedded Systems Engineer"
  after:  "The Everything Engineer"
```

Then fall through to **Step 2 — Fix-anything loop**.

---

## Sub-flow D — Edit skills arrays

### D1. Pick the bucket

```
Q: "Which skills bucket?"
header: "Bucket"
options:
  - hardware
  - software
  - tools
```

### D2. Action

```
Q: "What kind of change?"
header: "Action"
options:
  - Add an item
  - Remove an item
  - Reorder (lead with X)
  - Replace the whole array
```

### D3. Apply the change

`Edit` the JSON. Cap each array at ~10 — warn if a new entry would push
it over.

Fall through to **Step 2**.

---

## Step 2 — Fix-anything loop

```
Q: "Anything to fix before I validate?"
header: "Review"
options:
  - Ship it
  - Edit a field I just set
  - Re-do the whole entry
  - Abandon (revert the file)
```

- **Edit** → ask which field, re-prompt, `Edit` again.
- **Re-do** → undo by `Edit`ing the entry back to its prior state (or revert
  via `git checkout` on the file if no other changes pending), then return
  to Step 1.
- **Abandon** → `git checkout src/content/portfolio.json` (only safe if no
  other unsaved changes; check `git status` first).

---

## Step 3 — Validate and test

```bash
npm run validate:content && npm test
```

If validation fails, surface the validator's error verbatim. The schema
errors are usually specific (e.g. "experience[0].coordinates.lat is
required"). Loop back to Step 2 with the offending field for editing.

---

## Step 4 — Commit and push

Commit messages (imperative, one line):

- `Add Hamming AI experience entry`
- `Update Reazon role description`
- `Refresh bio paragraph`
- `Add ROS2 to software skills`

```
Q: "Commit message: '<draft>' — ship?"
header: "Commit"
options:
  - Ship
  - Edit message
  - Hold off
```

```bash
git add src/content/portfolio.json
git commit -m "<message>"
git push origin main
```

---

## Step 5 — Report back

- ✅ What was changed
- Commit SHA
- Live URL: `<siteConfig.url>/scrollable` (since the timeline and
  globe show experience/education); resolve via `src/lib/site-config.ts`
- "Vercel will deploy in ~1-2 min"

---

## Refusal cases

- Grades / GPA without explicit user OK
- Salary, equity, NDA-covered details about a current/former employer
- Real street addresses (always use city/metro)
- Putting a real personal phone number in `personal.contact`

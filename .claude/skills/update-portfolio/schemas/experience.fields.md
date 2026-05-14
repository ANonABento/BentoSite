# Experience / education / bio field reference

**Re-read this file every time you edit `src/content/portfolio.json`.**
The file has five top-level sections — only edit one at a time:

| Section | What lives there |
|---|---|
| `personal` | Name, title, location, email, social links, school, degree |
| `about` | Bio paragraph(s) — markdown string with `\n\n` between paragraphs |
| `skills` | Three arrays: `hardware`, `software`, `tools` |
| `experience` | Array of work / research / project entries |
| `education` | Array of schools |

Schema is enforced by `npm run validate:content`. Do NOT add a `projects`
field — projects live in `src/content/projects/*.json` now and the
validator will reject the extra field.

---

## `experience[]` entry shape

```json
{
  "id": "hamming",
  "company": "Hamming AI",
  "role": "Software Engineer",
  "location": "Austin, Texas, United States",
  "coordinates": { "lat": 30.2672, "lng": -97.7431 },
  "period": "Dec 2025 - Present",
  "description": "YC S24 startup building AI-powered developer tools.",
  "type": "work",
  "technologies": ["Python", "AI/ML", "Full Stack"]
}
```

### REQUIRED for experience

| Field | Type | Notes |
|---|---|---|
| `id` | string | kebab-case, unique within `experience[]` |
| `company` | string | Display name of the company / org |
| `role` | string | Job title |
| `location` | string | "City, State/Region, Country" |
| `coordinates` | `{lat, lng}` | Drives the globe pin on `/scrollable`. **Required.** |
| `period` | string | e.g. `"Dec 2025 - Present"`, `"Jun 2025 - Aug 2025"`. Use 3-letter month + 4-digit year. |
| `type` | enum | `"work"`, `"research"`, `"internship"`, `"project"` |

### NEAR-REQUIRED for experience

| Field | Type | Notes |
|---|---|---|
| `description` | string | 1-3 sentences. Lead with concrete impact (numbers, technologies). |
| `technologies` | string[] | Tools/stacks used. Cap ~6. |

### Coordinate lookup

For known major cities, look up `{lat, lng}` from training knowledge. **Always
show the proposed coordinates in the preview and ask the user to confirm**
— a wrong pin on the globe is more embarrassing than asking. Examples:

- Waterloo, Ontario, Canada → `43.4643, -80.5204`
- Toronto, Ontario, Canada → `43.6532, -79.3832`
- Austin, Texas, USA → `30.2672, -97.7431`
- Akihabara, Tokyo, Japan → `35.6984, 139.7731`
- San Francisco, California, USA → `37.7749, -122.4194`
- New York City, USA → `40.7128, -74.0060`
- London, UK → `51.5074, -0.1278`

For cities you're not sure about, `WebFetch` the Wikipedia infobox or ask.

---

## `education[]` entry shape

```json
{
  "id": "uwaterloo",
  "institution": "University of Waterloo",
  "degree": "BASc in Computer Engineering",
  "period": "Sept 2024 - Present",
  "location": "Waterloo, Ontario, Canada",
  "coordinates": { "lat": 43.4723, "lng": -80.5449 }
}
```

### REQUIRED for education

| Field | Type | Notes |
|---|---|---|
| `id` | string | kebab-case, unique |
| `institution` | string | Display name |
| `degree` | string | Full degree title |
| `period` | string | Same format as experience |
| `location` | string | "City, State/Region, Country" |
| `coordinates` | `{lat, lng}` | Globe pin |

### OPTIONAL for education

| Field | Type | Notes |
|---|---|---|
| `description` | string | If there's a notable specialization / honors |
| `gpa` | string | Only if user explicitly wants it public — defaults to omit |

**Never publish grades or GPA unless the user explicitly says yes.**

---

## `personal` shape (single object — edit fields, not the shape)

```json
{
  "name": "Kevin Jiang",
  "title": "The Everything Engineer",
  "location": "Waterloo, Ontario, Canada",
  "email": "k69jiang@uwaterloo.ca",
  "github": "https://github.com/ANonABento",
  "linkedin": "https://linkedin.com/in/ANonABento",
  "university": "University of Waterloo",
  "degree": "BASc in Computer Engineering"
}
```

When editing `personal`, only change individual fields — never restructure
the object. Email and social URLs need real values; do not put placeholders.

---

## `about` (a single string)

Markdown-flavored prose. Paragraph breaks are `\n\n` (escaped). 2-4
paragraphs total is the right length — the dashboard and `/scrollable`
both render this. Don't add headings or lists; keep it conversational.

---

## `skills` (three flat arrays)

```json
{
  "hardware": ["STM32 & ESP32", "PCB Design (Altium)", ...],
  "software": ["Python", "C / C++", ...],
  "tools": ["Fusion 360", "OnShape", "Blender", ...]
}
```

- Don't add a fourth bucket — only `hardware`, `software`, `tools` are
  rendered.
- Cap each array at ~10 entries. The skills grid breaks visually past
  that on mobile.
- Order matters — first item appears first. Lead with the most prominent.

---

## Sort order in `experience[]` and `education[]`

Newest first. When you add an entry, insert it at index 0 unless the
user's `period` start date is older than an existing entry.

---

## What never goes in this file

- A `projects` field — rejected by validator.
- Grades, GPA, transcripts unless explicitly requested public.
- Employer salary, NDA-covered project details.
- Real coordinates for cities the user lives in if privacy is a concern —
  default to the metro area, not a street address.

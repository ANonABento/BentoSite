# Photo field reference

**Re-read this file every time you add a photo.** A photo has two artifacts:
the image file and the sidecar JSON. The sync script ignores any image
without a sidecar — that is by design.

## File locations

- Image: `public/photos/<slug>.jpg` (or `.png` / `.webp`)
- Sidecar: `public/photos/<slug>.json` (same slug as the image)
- Manifest: `public/photos/manifest.json` — **generated**, never hand-edited

## Slug rules

- Lowercase only
- Hyphens for spaces; no underscores
- No special characters except hyphens
- Cap at ~50 chars
- Include the location or subject for findability (e.g. `tokyo-shinjuku-night`)

## Sidecar JSON — all 4 fields are REQUIRED

```json
{
  "title": "Shinjuku at Night",
  "location": "Tokyo, Japan",
  "year": "2026",
  "alt": "Neon-lit streets of Shinjuku with crowds and tall LED signage."
}
```

| Field | Notes |
|---|---|
| `title` | Display title. Short, descriptive. Title-case. |
| `location` | City, Country (or City, State, Country if useful). Drives the globe pin on `/photography` eventually. |
| `year` | Four-digit year as a string, e.g. `"2026"`. The gallery sorts newest year first. |
| `alt` | Screen-reader and SEO description. Describe what's **visible**, not the title or vibe. 1-2 sentences. |

## Dimensions

You do not write width/height. `npm run sync:photos` auto-detects via
`sharp` and writes them into `manifest.json`.

## Alt-text guidance

Bad: `"Photo from Tokyo"` (restates title and location, no value to a
screen-reader user).

Bad: `"Beautiful shot at golden hour"` (subjective, not descriptive).

Good: `"Neon-lit streets of Shinjuku with crowds and tall LED signage."`

Good: `"A red torii gate at the entrance to a forested mountain trail, with
fog drifting between trees."`

Aim for: subject + setting + notable detail. ~10-25 words.

## What never goes in this file

- EXIF dumps, camera model, ISO settings (not used by the gallery).
- Photos the user didn't take (or doesn't have rights to publish).
- Faces of identifiable people unless the user explicitly says it's OK.
- Subjective adjectives ("beautiful", "stunning") in `alt`. Describe, don't editorialize.

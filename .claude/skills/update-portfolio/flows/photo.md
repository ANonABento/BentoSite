# Flow: add a photo

Adding a photo to `/photography`. Two artifacts per photo: the image file
and a sidecar JSON. Both must land before sync. Re-read
`schemas/photo.fields.md` before drafting the sidecar.

## Scripted fast path

If you already have all required facts (`src`, `title`, `location`, `year`,
`alt`), use the non-interactive script instead of the manual steps:

```bash
npm run add:photo -- \
  --src "<source_path>" \
  --title "<title>" \
  --location "<location>" \
  --year "<yyyy>" \
  --alt "<alt>" \
  --sync \
  --json
```

Useful flags:
- `--slug <slug>` when Discord/user text implies a better filename.
- `--dry-run --json` for preview.
- `--overwrite` only when replacing the same photo intentionally.

The script copies/re-encodes the image, strips EXIF/GPS metadata, writes the
sidecar, and can rebuild `public/photos/manifest.json`. After it succeeds,
run `npm test`, then commit only the file paths reported by the script.

---

## Step 1 — Locate the image

How did the user provide the image?

```
Q: "Where's the image?"
header: "Source"
options:
  - Path on disk (I'll copy it)
  - Already in public/photos/ (just needs sidecar)
  - I haven't dropped it yet (I'll wait)
```

- **Path on disk** → ask for the path, verify it exists with `ls`, then
  proceed to Step 2.
- **Already in public/photos/** → list `public/photos/*.{jpg,png,webp}`,
  find the orphan (no matching `.json`), confirm it's the one.
- **Haven't dropped it** → ask the user to add the file and re-invoke
  the skill. Stop here.

---

## Step 2 — Slug the filename

If the source path has a messy filename (`IMG_4823.jpg`,
`Photo 2026-03-14 at 11.42.png`), derive a clean slug:

- Lowercase, hyphens for spaces
- Strip special characters
- Cap ~50 chars
- Include location or subject if known: `tokyo-shinjuku-night.jpg`

Ask the user only if the slug isn't obvious. Otherwise show the inferred
slug in the preview.

---

## Step 3 — Copy the image into place

Prefer `npm run add:photo` for this step. If doing the manual path, copy the
image into `public/photos/<slug>.<ext>` and make sure EXIF/GPS metadata has
been stripped before committing.

Verify with `ls public/photos/<slug>.<ext>`. Use `Read` on the image file
to confirm it's a valid image (your image-reading capability will surface
the contents; if it errors, stop and ask the user).

---

## Step 4 — Draft the sidecar

Required fields (all 4): `title`, `location`, `year`, `alt`.

**Try to infer first**:
- `year`: from EXIF (`exiftool` if available) or from the filename
  (`Photo 2026-03-14` → `"2026"`). If neither, ask.
- `location`: from EXIF GPS only if the user has explicitly opted in to
  embedding GPS — otherwise ask.
- `title`: from the filename if it's descriptive; otherwise ask.
- `alt`: this is the one you must ask for unless you can actually see the
  image (use `Read` on the image, then describe what you see — but always
  show the proposed alt-text in the preview for user confirmation).

If any required field can't be inferred, ask via free-text prompt. **Do
not invent**:

> "I need 3 more things to ship this: title, location, year. What's the
> title?"

Then write `public/photos/<slug>.json` with all 4 fields populated.

---

## Step 5 — Show the draft

Cat the sidecar back:

```
Drafted public/photos/<slug>.json:
  title:    <title>
  location: <location>
  year:     <year>
  alt:      <alt>
```

---

## Step 6 — Fix-anything loop

```
Q: "Anything to fix before I sync?"
header: "Review"
options:
  - Ship it
  - Edit a field
  - Re-do alt-text (I'll re-look at the image)
  - Abandon (delete the image + sidecar)
```

- **Edit a field** → ask which: `title`, `location`, `year`, `alt` (4 options,
  fits the cap exactly). Re-prompt with free text and `Edit` the sidecar.
- **Re-do alt-text** → `Read` the image again, propose a new alt, ask to
  confirm or edit.

Loop until "Ship it".

---

## Step 7 — Sync and test

```bash
npm run sync:photos && npm test
```

`sync:photos` auto-detects `width` / `height` via `sharp` and writes them
into `public/photos/manifest.json` along with the sidecar fields.

If sync skips your photo with a warning, you forgot the sidecar — go fix it.

If tests fail, surface verbatim, then:

```
Q: "sync/tests failed. Now what?"
header: "Failure"
options:
  - Fix the field it's complaining about
  - Show me the full error
  - Abandon (delete image + sidecar)
  - I'll fix it manually
```

---

## Step 8 — Commit and push

Commit message: imperative, one line. Examples:

- `Add Tokyo Shinjuku night photo`
- `Add 3 photos from Yosemite trip`
- `Add Banff Lake Louise photo`

```
Q: "Commit message: '<draft>' — ship?"
header: "Commit"
options:
  - Ship
  - Edit message
  - Hold off
```

Then:

```bash
git add public/photos/<slug>.<ext> \
        public/photos/<slug>.json \
        public/photos/manifest.json
git commit -m "<message>"
git push origin main
```

Name the files explicitly — never `git add -A`.

---

## Step 9 — Report back

- ✅ What was added
- Commit SHA
- Live URL: `<siteConfig.url>/photography` (resolve via `src/lib/site-config.ts`)
- "Vercel will deploy in ~1-2 min"

---

## Multi-photo batches

If the user wants to add several photos at once ("here are 5 from the
Tokyo trip"), run Steps 1-5 for each, then a single combined Step 6 fix
loop ("which photo to edit?"), then one sync, one commit covering all of
them. Don't make 5 separate commits.

## Refusal cases

- Faces of identifiable people without explicit OK
- Photos the user did not take
- Anything with embedded GPS the user didn't intend to publish (check EXIF
  with `exiftool` and warn if present)

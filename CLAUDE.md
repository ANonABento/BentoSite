# bentOS — Kevin Jiang portfolio

Next.js 16 + Tailwind 4. Routes:
- `/`: the BentoGrid, an infinite pannable canvas of project cards with a morphing search card and a pinned intro card. Its behaviour comes from v1 and Kevin likes it; improve it incrementally, don't rewrite it.
- `/projects/[id]`: gone; redirects (next.config) to `/?project=<id>`, which opens the viewfinder.
- `/?project=<id>`: the board with that project open in the viewfinder (`src/components/Viewfinder`). Clicking a card grows it into the viewfinder over the board; Esc, the backdrop or Back closes it.
- `/projects`: a plain list of every project.
- `/studio`: dev-only board editor (404 in production). Drag and resize cards, pick, upload and frame images; ⌘S writes `src/content/layout.json` through `/api/studio`, uploads land in `public/projects/<id>/` through `/api/studio/upload`, and each project's viewfinder list is saved into its JSON through `/api/studio/project`.

Content is plain JSON in `src/content/`, read at build time by `src/lib/content.ts`. The build fails if any project file contains `TODO(`.
- Jobs are in `portfolio.json` `experience`. One with `details` (markdown, plus optional `site` and `images`) gets a viewfinder entry, `job-<id>` (`getJobs`), opened by its row on the intro card. Jobs aren't board cards. Their media is edited in the JSON, not /studio.
- The résumé is `public/Kevin-Jiang-Resume.pdf` (short link `/resume`); `npm run resume` re-downloads it from the Google Doc.

## BentoGrid (`src/components/BentoGrid/`)
- The camera and pan momentum live in `core/useCamera`.
- The board is one tile repeated in every direction. The tile is hand-laid in `/studio` and saved to `src/content/layout.json`: the tile's size in cells, and each card's cell, size (any WxH up to 4x3) and `look` (image, focal point, zoom, variant `full`/`image`/`text`, description). `layout/tile.ts` turns it into slots and `core/useTiledBoard` renders the copies near the viewport. Nothing spawns, despawns or gets cloned, so panning back always shows the same cards in the same places. The tile wraps: a card's top-left is inside it, but the card may hang over the right or bottom edge into the next copy (filling the gap opposite), so seams needn't be straight; optional `shift` offsets each row of copies like brickwork (`layout/boardLayout` has the wrap math). Projects missing from layout.json aren't on the board.
- Rendered cards have instance ids, `<card id>@<copy col>,<copy row>`. The data behind them is shared, so `onCardSelect` receives the real card.
- `src/lib/board.ts` builds the board's cards from content plus the layout, for both `/` and `/studio`. The camera opens with the home group (intro, search, contact) centred.
- The search card's sticky and morphing states live in `cards/useSearchCardState`. While its slot is off screen it sticks to the edge. Every other copy of the tile shows an empty dashed dock in its place, and the first dock to come fully into view takes the search card, which glides there. Against a top or bottom edge the card folds down to its input row; against a side it shrinks to a drawer tab (showing the query and match count), and clicking it or pressing `/` slides the input bar out from that edge without moving the camera.
- Filtering dims the cards it leaves out, in place, so the board keeps its shape. Pinned cards (intro, contact) always pass.
- Thumbnails are real: photos, screenshots or CAD renders. A project with nothing real to show gets the `text` variant, never generated art. A project's `media.preview` is a short muted mp4 cut from real footage (card aspect at 1.25x, a few hundred KB) that the card plays over its image while hovered. Muted cards (unlit by the spotlight, or filtered out) go grayscale and dark rather than transparent; hover brings an unlit card's colour back.
- The camera's base zoom scales with the window (`fitZoom`, with references in `CAMERA`). The visitor steps zoom through `CAMERA.zoomLevels` (multiples of it) with the search card's −/+ buttons, the - and = keys, or a trackpad pinch; R resets it. Docked, the search card zooms with the board (content scaled); stuck to an edge it's back to default size.
- Spotlight (`spotlight` prop, on for `/`): the board opens with only the intro and contact in the home copy lit (`inSpotlight`); each project lights up while the pointer is over it. The "Show all" pill, panning away from home, or searching lights the rest, and it stays lit for the tab session (`bentOS.explored`).
- Boot (`_components/TrayFill`, once per tab session, not for deep links or reduced motion): the cards drop in, rippling from the centre. On desktop the board opens zoomed out for it (`intro` prop → `useCamera`'s `introZoom`) and `settle` glides in to the home group; any wheel, drag or key hurries it. While it runs the board is frozen at the opening view and cards the landing view won't show are plain stand-ins (`DesktopCardLayer` `live`), swapped for real cards once it lands; the card layer is memoised so camera moves don't re-render cards.
- The engine reads the CSS variables defined at the top of `src/app/globals.css`.

## Prologue (`src/components/Prologue/`)
- A visit that gets the boot gets the prologue first, over the page: a robot maid wakes in a dark CRT's reflection, tidies her headdress, wipes the glass and switches the TV on, and the camera dives into the screen. At the dive it hands off: the board mounts and boots underneath while the prologue fades. Skip, Esc or Enter hand off at once, and any failure (no WebGL, a missing file, nothing on screen in 10 s) goes straight to the board. `?noprologue` turns it off.
- Desktop runs the live scene (`engine/prologue.js`, plain JS typed by `.d.ts`, three.js); phones play `public/prologue/prologue.mp4`, a recording of it. Sound is opt-in (`engine/sfx.js`, synthesised).
- The script is `prototypes/crt-site/PROLOGUE.md`. `prototypes/crt-site/index.html` runs the same engine with a tuning GUI and scrubbing (`?t=`); serve the repo root with `python3 prototypes/crt-site/serve.py` (port 4173, caching off so edits show on reload). How to edit it: `prototypes/crt-site/EDITING.md`.
- The prologue is edited in Theatre.js on the tuning page: its timeline is the scene's clock (scrub, play, keyframe), objects Retime (`hold`: pauses), Camera (the shot keyframed up to the dive, seeded from the scripted glass shot and pull-back), Her / body, head, eyes, hands and Lights / scene (the script's own channels, seeded into keys by `prototypes/crt-site/seed.js`; `use` 0 plays the script), Lights / gain (multipliers), and `Settings / …` (the click time, headdress, eyes, light). SAVE writes `src/components/Prologue/theatre-state.json` through `serve.py`; the site plays that file with `@theatre/core` (`engine/timeline.js`), never the studio. A new editable value is a `TL.define` prop in prologue.js, read where it's used.
- The model is `public/prologue/robot-maid.glb`, rebuilt by `prototypes/robot/blender/vroid_maid.py` (see `prototypes/robot/README.md`). Re-record the phone video after changing the scene.

## Viewfinder (`src/components/Viewfinder/`)
- A project's media, in tabs: all its images in one gallery, then a tab per video (YouTube, Vimeo, file), embed (any page in a frame, e.g. a live demo), 3D model (.stl/.glb) and PDF.
- The list is `media.viewfinder` in the project's JSON, edited in `/studio`. Without it, the project shows its images, then its live demo (`viewfinderItems` in `src/lib/board.ts`).
- three.js is loaded only when a 3D tab opens. Models are centred and scaled to a fixed size, so any unit works.
- While open it takes the keyboard (capture phase), so the board's WASD, R and / stay still; ⌘/Ctrl shortcuts pass through.

## Design (project pages)
- Pages are built as a bento tray: `.tray` holding `.cell` compartments. Orange is for links and highlights; purple is for terminal text, in-progress status and focus.
- The CRT look (`.crt`, VT323, `.wordmark`) is for system and meta info only.

## Checks
`npm run lint && npm run type-check && npm run build`

v1 (boot screen, 3D, games, chat) is at tag `v1-bentos`.

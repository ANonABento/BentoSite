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
- The camera's base zoom scales with the window (`fitZoom`, with references in `CAMERA`). The visitor steps zoom through `CAMERA.zoomLevels` (multiples of it) with the search card's −/+ buttons, the - and = keys, or a trackpad pinch; R resets it. Docked, the search card zooms with the board (content scaled); stuck to an edge it's back to default size.
- Spotlight (`spotlight` prop, on for `/`): the board opens with only the intro and contact in the home copy lit (`inSpotlight`); each project lights up while the pointer is over it. The "Show all" pill, panning away from home, or searching lights the rest, and it stays lit for the tab session (`bentOS.explored`).
- Boot (`_components/TrayFill`, once per tab session, not for deep links or reduced motion): the cards drop in, rippling from the centre. On desktop the board opens zoomed out for it (`intro` prop → `useCamera`'s `introZoom`) and `settle` glides in to the home group; any wheel, drag or key hurries it.
- The engine reads the CSS variables defined at the top of `src/app/globals.css`.

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

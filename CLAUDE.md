# bentOS — Kevin Jiang portfolio

Next.js 16 + Tailwind 4. Routes:
- `/`: the BentoGrid, an infinite pannable canvas of project cards with a morphing search card and a pinned intro card. Its behaviour comes from v1 and Kevin likes it; improve it incrementally, don't rewrite it.
- `/projects/[id]`: one static page per project.
- `/projects`: a plain list of every project.
- `/studio`: dev-only board editor (404 in production). Drag and resize cards, pick, upload and frame images; ⌘S writes `src/content/layout.json` through `/api/studio`, and uploads land in `public/projects/<id>/` through `/api/studio/upload`.

Content is plain JSON in `src/content/`, read at build time by `src/lib/content.ts`. The build fails if any project file contains `TODO(`.

## BentoGrid (`src/components/BentoGrid/`)
- The camera and pan momentum live in `core/useCamera`.
- The board is one tile repeated in every direction. The tile is hand-laid in `/studio` and saved to `src/content/layout.json`: the tile's size in cells, and each card's cell, size (any WxH up to 4x3) and `look` (image, focal point, zoom, variant `full`/`image`/`text`, description). `layout/tile.ts` turns it into slots and `core/useTiledBoard` renders the copies near the viewport. Nothing spawns, despawns or gets cloned, so panning back always shows the same cards in the same places. Projects missing from layout.json aren't on the board.
- Rendered cards have instance ids, `<card id>@<copy col>,<copy row>`. The data behind them is shared, so `onCardSelect` receives the real card.
- `src/lib/board.ts` builds the board's cards from content plus the layout, for both `/` and `/studio`. The camera opens with the home group (intro, search, contact) centred.
- The search card's sticky and morphing states live in `cards/useSearchCardState`. While its slot is off screen it sticks to the edge. Every other copy of the tile shows an empty dashed dock in its place, and the first dock to come fully into view takes the search card, which glides there.
- Filtering dims the cards it leaves out, in place, so the board keeps its shape. Pinned cards (intro, contact) always pass.
- The camera's base zoom scales with the window (`fitZoom`, with references in `CAMERA`).
- The engine reads the CSS variables defined at the top of `src/app/globals.css`.

## Design (project pages)
- Pages are built as a bento tray: `.tray` holding `.cell` compartments. Orange is for links and highlights; purple is for terminal text, in-progress status and focus.
- The CRT look (`.crt`, VT323, `.wordmark`) is for system and meta info only.

## Checks
`npm run lint && npm run type-check && npm run build`

v1 (boot screen, 3D, games, chat) is at tag `v1-bentos`.

# bentOS — Kevin Jiang portfolio

Next.js 16 + Tailwind 4. Routes:
- `/`: the BentoGrid, an infinite pannable canvas of project cards with a morphing search card and a pinned intro card. Its behaviour comes from v1 and Kevin likes it; improve it incrementally, don't rewrite it.
- `/projects/[id]`: one static page per project.
- `/projects`: a plain list of every project.

Content is plain JSON in `src/content/`, read at build time by `src/lib/content.ts`. The build fails if any project file contains `TODO(`.

## BentoGrid (`src/components/BentoGrid/`)
- The camera and pan momentum live in `core/useCamera`.
- The board is one tile repeated in every direction. `layout/tile.ts` packs every card once into a gapless block built from bands two rows tall, and `core/useTiledBoard` renders the copies near the viewport. Nothing spawns, despawns or gets cloned, so panning back always shows the same cards in the same places.
- Rendered cards have instance ids, `<card id>@<copy col>,<copy row>`. The data behind them is shared, so `onCardSelect` receives the real card.
- Card size comes from the data (`card.size`). It encodes importance, not image shape: in `src/app/page.tsx` a project is 2x2, or 3x2 if featured; the intro is 3x2, tech tiles are 1x1 and the search card is 2x1. The packer pads bands with pairs of tech tiles first, then widens 2x2 projects to 3x2.
- The home band holds experience, the intro, the search card (with two tech tiles under it) and about. The camera opens with the intro centred, and featured projects sit in the bands nearest it.
- The search card's sticky and morphing states live in `cards/useSearchCardState`. While its slot is off screen it sticks to the edge. Every other copy of the tile shows an empty dashed dock in its place, and the first dock to come fully into view takes the search card, which glides there.
- Filtering rebuilds the tile from the matching cards. Pinned cards (intro, experience, about) and filler tiles always pass the filter.
- The camera's base zoom scales with the window (`fitZoom`, with references in `CAMERA`).
- The engine reads the CSS variables defined at the top of `src/app/globals.css`.

## Design (project pages)
- Pages are built as a bento tray: `.tray` holding `.cell` compartments. Orange is for links and highlights; purple is for terminal text, in-progress status and focus.
- The CRT look (`.crt`, VT323, `.wordmark`) is for system and meta info only.

## Checks
`npm run lint && npm run type-check && npm run build`

v1 (boot screen, 3D, games, chat) is at tag `v1-bentos`.

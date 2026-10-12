# bentOS — Kevin Jiang portfolio

Next.js 16 + Tailwind 4. Routes:
- `/`: the BentoGrid, an infinite pannable canvas of project cards with a morphing search card and a pinned intro card. Its behaviour comes from v1 and Kevin likes it; improve it incrementally, don't rewrite it.
- `/projects/[id]`: one static page per project.
- `/projects`: a plain list of every project.

Content is plain JSON in `src/content/`, read at build time by `src/lib/content.ts`. The build fails if any project file contains `TODO(`.

## BentoGrid (`src/components/BentoGrid/`)
- The camera and pan momentum live in `core/useCamera`. Spawn and despawn of pooled cards live in `core/useBoardController`, and layout in `layout/`.
- The search card's sticky and morphing states live in `cards/useSearchCardState`. Matter.js handles the search card's collision body.
- Small pools are cycled with `-clone-N` ids (`duplicate-fill.ts`). Strip that suffix before routing. Mobile drops the clones.
- Card size comes from the data (`card.size`). It encodes importance, not image shape: in `src/app/page.tsx` a project is 2x2, or 3x2 if featured; the intro is 3x2, tech tiles are 1x1 and the search card is 2x1. Nearly everything is two rows tall, so the board reads in bands.
- The board remembers where it put each card. A card that scrolls away keeps its grid slot (`homesRef` in `core/useBoardController`), so panning back shows the same cards in the same places. New cards only go into unexplored slots near the viewport. Once every card has a place, the slots furthest from the visitor are recycled first.
- When the search card re-anchors, cards in its way slide to the nearest free slot. They are never removed, and pinned cards are never displaced.
- `findNearest` prefers slots that touch existing cards, and the first screenful places the largest cards first, which keeps packing tight.
- The camera's base zoom scales with the window (`fitZoom`, with references in `CAMERA`).
- `type: 'intro'` cards are pinned beside the search card. They never recycle and always pass the filter.
- The engine reads the CSS variables defined at the top of `src/app/globals.css`.

## Design (project pages)
- Pages are built as a bento tray: `.tray` holding `.cell` compartments. Orange is for links and highlights; purple is for terminal text, in-progress status and focus.
- The CRT look (`.crt`, VT323, `.wordmark`) is for system and meta info only.

## Checks
`npm run lint && npm run type-check && npm run build`

v1 (boot screen, 3D, games, chat) is at tag `v1-bentos`.

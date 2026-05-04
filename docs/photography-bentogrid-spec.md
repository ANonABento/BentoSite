# Photography BentoGrid Integration Spec

Status: **Planned** — blocked on BentoGrid stabilization (see [bentogrid-handoff.md](bentogrid-handoff.md))

## Goal

Replace the standalone `PhotographyGallery` component with a BentoGrid-powered photo grid at `/photography`. Photos become first-class BentoGrid citizens alongside projects and playground games — same infinite canvas, physics, search, keyboard navigation.

## Current State

Photography lives in `src/app/photography/_components/PhotographyGallery.tsx` — a self-contained 217-line component with:
- CSS grid layout (1→2→3 columns by breakpoint)
- Modal lightbox with keyboard nav
- 6 photos from `public/photos/manifest.json`
- No BentoGrid integration, no search/filter, no physics

Projects and Playground both use BentoGrid. Photography should too.

## Data Model

### Photo manifest (existing)

`public/photos/manifest.json` already has structured data:

```json
{
  "id": "lab-after-hours",
  "src": "/photos/lab-after-hours.jpg",
  "alt": "...",
  "title": "Lab After Hours",
  "location": "Waterloo",
  "year": "2026",
  "width": 1600,
  "height": 2000
}
```

### New CardData variant

Add `PhotoCardData` to the BentoGrid type system:

```typescript
// In BentoGrid.types.ts
export interface PhotoCardData extends BaseCardData {
  type: 'photo';
  src: string;            // image path (e.g. '/photos/lab-after-hours.jpg')
  alt: string;            // accessibility text
  location?: string;
  year?: string;
  width: number;          // intrinsic image width
  height: number;         // intrinsic image height
  blurDataURL?: string;   // base64 blur placeholder
}

export type CardType = 'game' | 'project' | 'photo';
export type CardData = GameCardData | ProjectCardData | PhotoCardData;
```

### Mapping function

```typescript
// In app/photography/_components/PhotosGridClient.tsx
function mapPhotoToCard(photo: PhotoItem): PhotoCardData {
  return {
    id: photo.id,
    type: 'photo',
    title: photo.title,
    description: photo.alt,
    category: photo.location,   // enables location-based filtering
    src: photo.src,
    alt: photo.alt,
    location: photo.location,
    year: photo.year,
    width: photo.width,
    height: photo.height,
    blurDataURL: photo.blurDataURL,
  };
}
```

## Card Component

### PhotoCard

New file: `src/components/BentoGrid/cards/PhotoCard.tsx`

Design direction:
- **Image-forward**: Photo fills the card, no surrounding chrome
- **Minimal overlay**: Title + location fade in on hover (desktop) or always visible (mobile)
- **Aspect-aware sizing**: Portrait photos → `1x2`, landscape → `2x1`, square-ish → `1x1`, featured → `2x2`
- **Blur placeholder**: Use `blurDataURL` from manifest for smooth load-in
- **No status badges, no tech tags** — clean gallery aesthetic

Interaction:
- Click → lightbox overlay (not route navigation like projects)
- The lightbox is a separate layer above BentoGrid, not a BentoGrid card
- Arrow keys navigate between photos while lightbox is open
- Escape closes lightbox

### Card sizing logic

```typescript
// In layout/cardSizes.ts
function getPhotoSize(photo: PhotoCardData, index: number): CardSize {
  const ratio = photo.width / photo.height;
  if (ratio > 1.4) return '2x1';   // wide landscape
  if (ratio < 0.75) return '1x2';  // tall portrait
  if (index === 0) return '2x2';   // feature the first photo
  return '1x1';                     // everything else
}
```

## Theme

### Gallery theme

New theme variant alongside `playful` and `premium`:

```typescript
export type GridTheme = 'playful' | 'premium' | 'gallery';
```

Design tokens:
- **Background**: Dark, minimal — let photos pop
- **Card border-radius**: Small (4-6px) — photos shouldn't be overly rounded
- **Card rotation**: 0 — photos should be straight
- **Card shadow**: Subtle, warm
- **Accent colors**: Neutral/warm — not competing with photo colors
- **Search card**: Glass panel, consistent with existing search card styling

## Route Setup

Mirror the projects/playground pattern:

```
src/app/photography/
├── page.tsx                          # Server shell, loads manifest
├── layout.tsx                        # Metadata
└── _components/
    ├── PhotosGridClient.tsx          # BentoGrid consumer (dynamic, ssr: false)
    ├── PhotographyGallery.tsx        # DELETE after migration
    ├── PhotographyGallery.types.ts   # Keep — PhotoItem type still useful
    └── PhotographyGallery.test.tsx   # Rewrite for new component
```

### PhotosGridClient

```typescript
'use client';

import dynamic from 'next/dynamic';
import type { PhotoItem } from './PhotographyGallery.types';

const BentoGrid = dynamic(
  () => import('@/components/BentoGrid').then((m) => m.BentoGrid),
  { ssr: false, loading: () => <LoadingSpinner /> },
);

export function PhotosGridClient({ photos }: { photos: PhotoItem[] }) {
  const cards = photos.map(mapPhotoToCard);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  return (
    <>
      <BentoGrid
        theme="gallery"
        cards={cards}
        renderCard={renderPhotoCard}
        onCardSelect={(card) => setLightboxPhoto(card.id)}
        onBack={() => router.push('/')}
        pageTitle="Photography"
      />
      {lightboxPhoto && (
        <PhotoLightbox
          photos={photos}
          activeId={lightboxPhoto}
          onClose={() => setLightboxPhoto(null)}
        />
      )}
    </>
  );
}
```

## Lightbox

The lightbox is **not** part of BentoGrid. It's a portal overlay rendered above everything.

Reuse the existing lightbox logic from `PhotographyGallery.tsx` (keyboard nav, body overflow lock, prev/next) but extract it into its own component:

```
src/app/photography/_components/PhotoLightbox.tsx
```

Features to keep:
- Full-screen overlay with dark backdrop + blur
- Arrow key / click navigation
- Escape to close
- Photo counter (X of Y)
- Body overflow lock

## Search & Filtering

BentoGrid search works automatically for any card type. Photos get:
- **Text search**: Matches title, alt text, location
- **Category filter**: Categories derived from `location` field (Waterloo, Toronto, Montreal, etc.)
- Optional: Add year as a secondary filter dimension later

## Phased Rollout

### Phase 1: BentoGrid prerequisites
- [ ] Stabilize BentoGrid core (fix uncommitted refactor, coordinate systems, `__search__` cleanup)
- [ ] Add `PhotoCardData` to type system
- [ ] Add `'gallery'` theme config

### Phase 2: Card & route
- [ ] Build `PhotoCard` component
- [ ] Add photo card sizing logic
- [ ] Create `PhotosGridClient` consumer
- [ ] Wire up `/photography` route to use BentoGrid

### Phase 3: Lightbox
- [ ] Extract lightbox from existing gallery into `PhotoLightbox`
- [ ] Connect lightbox to BentoGrid card selection
- [ ] Keyboard navigation within lightbox

### Phase 4: Polish
- [ ] Generate blur placeholders for all photos
- [ ] Tune gallery theme colors/shadows
- [ ] Mobile scroll view styling for photo cards
- [ ] Remove old `PhotographyGallery` component
- [ ] Update tests

## Open Questions

1. **Card click behavior**: Lightbox (in-page overlay) vs dedicated photo detail route (`/photography/[id]`)? Lightbox feels more natural for a gallery. Going with lightbox for now.
2. **Photo count**: 6 photos is sparse for an infinite canvas. Need a minimum viable count (~12-15) before the grid feels alive. Add more photos before launch?
3. **Metadata expansion**: Worth adding camera/lens/settings info to manifest? Not blocking but would enrich the cards.
4. **Zoom behavior**: Should BentoGrid zoom on a photo card do something special (progressive resolution load)? Probably overkill for v1.

# SEO Conventions

This portfolio uses Next.js metadata plus JSON-LD structured data for every public route.

## Required Routes

Keep `REQUIRED_SEO_ROUTES` in `src/lib/seo.ts` aligned with public App Router pages:

- `/`
- `/projects`
- `/playground`
- `/playground/<game>`
- `/photography`
- `/scrollable`
- `/404`

## Metadata Rules

- Define route SEO data in `src/lib/seo.ts`.
- Use branded titles in this format: `{Page} — bentOS / Kevin Jiang`.
- Include a route-specific description of at least one clear sentence.
- Generate route metadata with `createRouteMetadata(...)` so canonical, Open Graph, and Twitter metadata stay consistent.
- Client-heavy pages should move interactivity into a client component and keep the route page or layout as a server component for metadata.

## JSON-LD Rules

- Home: `Person`, `WebSite`, and profile `WebPage` data.
- Projects: `CollectionPage` with `CreativeWork` items.
- Playground hub: `CollectionPage` with game list items.
- Playground games: `Game` per route.
- Photography: `ImageGallery` represented as the main entity of the gallery page.
- Scrollable: `WebPage` as the alternate portfolio presentation.
- 404: `WebPage` for the explicit `/404` route and the App Router not-found fallback.

Use the `JsonLd` component in `src/components/seo/JsonLd.tsx` for script serialization. Avoid adding duplicate site-wide structured data in the root layout; route wrappers should include only the schema for that route.

## CI Gate

`npm test` runs the SEO validator in `src/lib/__tests__/seo-validator.test.ts`.
The gate fails when a required route is missing from the App Router, lacks central SEO config, loses branded metadata, lacks canonical URLs, or has no declared schema coverage.

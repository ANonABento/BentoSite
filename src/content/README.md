# Portfolio Content

Edit `portfolio.json` to update site content. This file is the single source of truth for:
- Personal info
- About copy
- Skills
- Projects
- Experience
- Education

Notes:
- `projects` drives both the featured grid and the projects modal.
- The `/projects` BentoGrid page also maps this data into project cards through `src/lib/projects-data.ts`.
- Use `featured: true` to surface a project in the featured grid.
- `category` and `technologies` are used by project filtering/search surfaces.
- `description` is the longer summary; `shortDescription` is used in cards.
- `media` supports `images`, `video`, `website`, `pdf`, and `game`.

## Sync with portfolio-sync

`portfolio-sync` now treats `src/content/portfolio.json` as the canonical generated feed.

- `npm run sync-portfolio`  
  Fetches each GitHub repo in your configured owner and regenerates `portfolio.json` from `.portfolio.json` files.

- `npm run sync-portfolio:dry-run`  
  Prints the generated feed to stdout without writing files.

- `npm run sync-portfolio:validate`  
  Validates the current `src/content/portfolio.json` against the portfolio schema.

If GitHub rate limits are hit, the command keeps the existing portfolio data and marks the sync metadata as stale so the UI can display a fallback badge.

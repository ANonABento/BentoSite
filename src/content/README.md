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

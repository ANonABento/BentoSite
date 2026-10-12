# bentOS

Kevin Jiang's portfolio. Next.js + Tailwind, fully static.

```bash
npm run dev     # localhost:3000
npm run build
```

## Editing content

Everything the site shows lives in `src/content/`:

- `portfolio.json`: bio, skills, experience, education, and the ordered `featured` list for the top tray on the home page.
- `projects/<id>.json`: one file per project. The filename is the URL (`/projects/<id>`).
  - `dateCompleted` is `YYYY` or `YYYY-MM` and sets sort order.
  - `media.featuredImage` points into `public/projects/<id>/`.
  - `description` is Markdown.

Add a project by copying an existing JSON file and dropping its image in `public/projects/<id>/`. No build step or generator to run.

The previous version (boot screen, 3D viewer, physics grid, games, chat) is tagged `v1-bentos`.

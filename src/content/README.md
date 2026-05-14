# Portfolio Content

Single source of truth for everything the public site shows about Kevin.

## Layout

```
src/content/
├── portfolio.json                  # bio, skills, experience, education, contact
├── projects/<id>.json              # one project per file (source)
├── projects.generated.json         # built from projects/ (DO NOT EDIT)
├── talking-points/<id>.json        # FAQ-style content for the chat assistant
└── talking-points.generated.json   # built from talking-points/ (DO NOT EDIT)
```

## How to update

See **[AGENTS.md](AGENTS.md)** in this directory for the full playbook
(adding projects, photos, talking points, bio, swapping the resume).

## Quick commands

```bash
npm run sync              # regenerate everything + validate
npm run sync:projects     # rebuild projects.generated.json + talking-points.generated.json
npm run sync:photos       # rebuild public/photos/manifest.json from sidecars
npm run validate:content  # validate portfolio.json schema
```

`npm run dev` and `npm run build` invoke `npm run sync` automatically via
the `predev` / `prebuild` hooks, so the generated files are always fresh.

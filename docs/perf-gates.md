# Performance Gates

This repo enforces two PR performance gates in GitHub Actions: Lighthouse CI score thresholds and per-route bundle growth checks.

## Lighthouse CI

Config: `lighthouserc.json`

Lighthouse runs against the production Next.js server on these routes:

| Route | Performance | Accessibility | Best Practices | SEO | Rationale |
|---|---:|---:|---:|---:|---|
| `/` | 90 | 90 | 95 | 95 | Primary landing route should stay fast. |
| `/projects` | 75 | 90 | 95 | 95 | Allows lower performance because the route includes Three.js-heavy project browsing. |
| `/playground` | 80 | 90 | 95 | 95 | Allows lower performance because the route includes the physics-driven Playground grid. |
| `/playground/2048` | 90 | 90 | 95 | 95 | Individual game route should remain lightweight. |
| `/playground/aim-trainer` | 90 | 90 | 95 | 95 | Individual game route should remain lightweight. |
| `/playground/minesweeper` | 90 | 90 | 95 | 95 | Individual game route should remain lightweight. |
| `/playground/pacman` | 90 | 90 | 95 | 95 | Individual game route should remain lightweight. |
| `/playground/reaction` | 90 | 90 | 95 | 95 | Individual game route should remain lightweight. |
| `/playground/rhythm` | 90 | 90 | 95 | 95 | Individual game route should remain lightweight. |
| `/playground/sorting` | 90 | 90 | 95 | 95 | Individual game route should remain lightweight. |
| `/playground/soundboard` | 90 | 90 | 95 | 95 | Individual game route should remain lightweight. |
| `/playground/typing` | 90 | 90 | 95 | 95 | Individual game route should remain lightweight. |
| `/photography` | 90 | 90 | 95 | 95 | Static gallery route should stay fast. |
| `/scrollable` | 90 | 90 | 95 | 95 | Long-form portfolio route should stay fast. |

Lighthouse also hard-fails cumulative layout shift above `0.1` and requires document title, `html[lang]`, and meta description checks to pass.

## Bundle Size Diff

Script: `scripts/check-bundle-size.mjs`

The PR job builds the base branch, downloads the current branch build artifact, and compares gzip-compressed JS/CSS assets listed in Next.js route manifests for each gated route. The script supports both `app-build-manifest.json` and the per-route client reference manifests emitted by Next.js 16/Turbopack.

Any route with more than `10%` bundle growth fails the job. To intentionally accept larger growth, include `[allow-bundle-growth]` in the PR title or body. The override keeps the route diff visible in CI while allowing the job to pass.

The existing absolute bundle budget mode remains available:

```bash
npm run size
npm run size:check
```

For local route diff checks after building a base copy:

```bash
npm run size:diff -- ../base-bundle/.next --head .next --max-growth-percent=10
```

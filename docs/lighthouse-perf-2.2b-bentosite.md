# Perf 2.2b Lighthouse Notes

Routes covered by `lighthouserc.js`:

| Route | Performance target | Accessibility | Best Practices | SEO | Notes |
| --- | ---: | ---: | ---: | ---: | --- |
| `/` | 80+ | 90+ | 90+ | 90+ | 3D dashboard route; avoids hidden duplicate mobile/desktop 3D mount. |
| `/projects` | 95+ | 90+ | 90+ | 90+ | Physics grid route; bundle is isolated behind route-level dynamic import. |
| `/playground` | 95+ | 90+ | 90+ | 90+ | Physics grid route; bundle is isolated behind route-level dynamic import. |
| `/playground/2048` | 95+ | 90+ | 90+ | 90+ | Lightweight game route. |
| `/playground/aim-trainer` | 80+ | 90+ | 90+ | 90+ | 3D-heavy game route; realistic performance target is below static pages. |
| `/playground/minesweeper` | 95+ | 90+ | 90+ | 90+ | Lightweight game route. |
| `/playground/pacman` | 95+ | 90+ | 90+ | 90+ | Canvas/game loop route. |
| `/playground/reaction` | 95+ | 90+ | 90+ | 90+ | Lightweight game route. |
| `/playground/rhythm` | 95+ | 90+ | 90+ | 90+ | Mode selector only on first load; game engines load after selection. |
| `/playground/sorting` | 95+ | 90+ | 90+ | 90+ | Lightweight visualizer route. |
| `/playground/soundboard` | 95+ | 90+ | 90+ | 90+ | Audio work starts from user interaction. |
| `/playground/typing` | 95+ | 90+ | 90+ | 90+ | Lightweight game route. |
| `/photography` | 95+ | 90+ | 90+ | 90+ | First gallery image is prioritized; photo assets receive immutable cache headers. |
| `/scrollable` | 80+ | 90+ | 90+ | 90+ | Hero includes 3D; minimal viewer mode disables screenshot buffer overhead. |

Implemented fixes:

- Dashboard now mounts only the active viewport-specific viewfinder, preventing a hidden second 3D canvas on desktop.
- The viewfinder `suspended` path now returns a lightweight paused state before loading Three.js.
- The scrollable hero uses the minimal 3D viewer, avoiding nonessential controls and screenshot buffer overhead.
- Minimal 3D canvases avoid `preserveDrawingBuffer`; mobile canvases use a capped DPR and lower antialiasing cost.
- Photography gallery prioritizes the first image for LCP.
- `/photos` and `/data` static assets now receive immutable cache headers.
- LHCI now audits all acceptance routes.

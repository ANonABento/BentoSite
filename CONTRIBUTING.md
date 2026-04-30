# Contributing

Thanks for helping maintain Kevin Jiang's portfolio site. This is a Next.js 16 App Router project using React 19, TypeScript, Tailwind CSS 4, Three.js, React Three Fiber, Framer Motion, Matter.js, and Vitest. Keep changes focused, type-safe, and consistent with the existing component boundaries.

## Development Setup

1. Install the current LTS version of Node.js and npm.
2. Install dependencies with `npm install`.
3. Start the local app with `npm run dev`, then open `http://localhost:3000`.
4. Use `npm run build` when you need to verify production rendering, route behavior, or SSR/client boundaries.

Useful commands:

```bash
npm run dev
npm run type-check
npm run lint
npm run lint:fix
npm test
npm run test:watch
npm run test:coverage
npm run e2e
```

## Code Style

TypeScript should stay strict and explicit. Prefer small feature-local helpers, hooks, config files, and types instead of growing large components. Aim to keep files under roughly 300 lines when practical. Public imports should come from feature barrels such as `@/components/Dimension` instead of deep internal paths.

Run `npm run lint` before opening a pull request. Use `npm run lint:fix` for safe ESLint fixes. There is no standalone Prettier script in this repo; follow the formatting already present in nearby files and avoid introducing unrelated whitespace churn.

For styling, use the repo color system. Do not add hardcoded Tailwind palette colors like `bg-orange-500`, `text-violet-400`, or `border-red-500`. Prefer global utility classes from `src/app/globals.css`, shared helpers from `src/lib/colors.ts`, feature tokens, non-color Tailwind utilities, and inline styles only for dynamic values. Three.js and browser-only components must keep SSR disabled with `dynamic(..., { ssr: false })`.

## Commit Conventions

Use concise, descriptive commit messages in the imperative mood, for example `Add contributor guide` or `Fix BentoGrid search focus state`. Keep each commit scoped to one logical change. Do not mix formatting-only edits, content updates, and feature work unless they are required for the same fix.

## Pull Request Process

Before requesting review, make sure the branch is up to date, the diff is focused, and the user-facing behavior is described clearly. Include screenshots or short screen recordings for visual changes. Mention any routes, components, or data files touched. If a change affects SSR, routing, 3D rendering, or responsive behavior, call that out and include the verification you ran.

At minimum, run:

```bash
npm run type-check
npm test
```

Also run `npm run lint` for code changes, `npm run build` for route or server/client boundary changes, and Playwright checks when interaction or layout behavior changes.

## Adding a Project to BentoGrid

Project content starts in `src/content/portfolio.json`. Add a new entry to the `projects` array with a stable `id`, `name`, `shortDescription`, `category`, `status`, `technologies`, and any relevant `links`, `thumbnail`, `media`, `featured`, or `dateCompleted` fields. The shared project types live in `src/lib/projects-data.ts`, and `/projects` maps that content into BentoGrid cards in `src/app/projects/_components/ProjectsGridClient.tsx`.

Use `featured: true` only when the project should appear in the featured project surfaces. Put static thumbnails, images, PDFs, models, and other public assets under `public/`, then reference them with root-relative paths. If you add a new category or media shape, update the TypeScript types, mapping logic, filters, and tests that depend on those values.

## Tests

Unit and component tests use Vitest. Place new tests near the behavior they cover, either beside the source file or inside an existing `__tests__` directory. Prioritize behavior that should survive refactors: filtering, search, persistence helpers, loading and error states, keyboard navigation, card layout helpers, and SSR-sensitive utilities.

## AI Development Notes

AI-assisted contributors should read `CLAUDE.md` before making changes. It documents the project architecture, important commands, shared utilities, component directories, and repo-specific implementation patterns. The same standards apply to AI-generated code: keep changes scoped, use CSS variables for colors, respect feature boundaries, and run the relevant checks before handing work off.

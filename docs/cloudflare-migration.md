# Move BentoSite from Vercel to Cloudflare

Goal: anonabento.com fully on Cloudflare (registrar, DNS, Pages, Email Routing), with Vercel switched off.
Status: this is a plan. The domain isn't bought yet. An RDAP lookup on 2026-11-13 showed it unregistered, and Cloudflare listed it at about $10.46/yr.

## Why the build changes
Cloudflare Pages serves static files, so the site has to build with `output: 'export'`. Static export fails on these:
- `src/app/studio/page.tsx`, which sets `dynamic = 'force-dynamic'`
- `src/app/api/studio/{,upload/,project/}route.ts`, the POST handlers that write into the repo
- `redirects()` in `next.config.ts`
- `next/image` optimisation (`images.formats`)

The studio and its API only run in dev already (both 404 in prod). The fix is to keep them in dev and leave them out of the production build.

## 1. Domain
- [ ] Buy anonabento.com in the Cloudflare dashboard → Domain Registration.
- [ ] Click the ICANN verification email.

## 2. Code (branch `cloudflare-pages`)
- [ ] Rename the dev-only files so the prod build skips them:
  - `src/app/studio/page.tsx` → `page.dev.tsx`
  - `src/app/api/studio/route.ts` → `route.dev.ts`
  - `src/app/api/studio/upload/route.ts` → `route.dev.ts`
  - `src/app/api/studio/project/route.ts` → `route.dev.ts`
- [ ] `next.config.ts`:
  ```ts
  import type { NextConfig } from 'next';

  const isDev = process.env.NODE_ENV === 'development';

  const nextConfig: NextConfig = {
    // Static HTML in out/ for Cloudflare Pages. Dev keeps the server so /studio can save.
    output: isDev ? undefined : 'export',
    // *.dev.tsx / *.dev.ts (studio + its API) only exist under `next dev`.
    pageExtensions: isDev ? ['dev.tsx', 'dev.ts', 'tsx', 'ts'] : ['tsx', 'ts'],
    images: { unoptimized: true },
    allowedDevOrigins: ['*.trycloudflare.com'],
  };

  export default nextConfig;
  ```
- [ ] Add `public/_redirects` to replace `redirects()`:
  ```
  /projects/:id  /?project=:id  301
  /resume        /Kevin-Jiang-Resume.pdf  302
  ```
- [ ] Drop Vercel Analytics: remove the `Analytics` import and `<Analytics />` from `src/app/layout.tsx`, then run `npm uninstall @vercel/analytics`.
- [ ] In `package.json`, remove the `start` script, since `next start` doesn't serve an export. Optionally add `"preview": "npx serve out"`.
- [ ] Update CLAUDE.md: the `/projects/[id]` redirect now lives in `public/_redirects`, and the studio files are named `*.dev.*`.
- [ ] Check locally:
  ```
  npm run lint && npm run type-check && npm run build
  ls out/   # index.html, projects.html, _redirects, opengraph-image*, sitemap.xml, robots.txt
  npm run dev   # /studio still loads and ⌘S still saves layout.json
  ```
  If `pageExtensions` doesn't hide the studio from the build, fall back to a prebuild script that moves `src/app/studio` and `src/app/api` aside.

## 3. Cloudflare Pages
- [ ] Workers & Pages → Create → Pages → connect GitHub → ANonABento/BentoSite.
- [ ] Choose the "Next.js (Static HTML Export)" preset. Build command `npm run build`, output dir `out`, production branch `main`.
- [ ] Set the env var `NEXT_PUBLIC_SITE_URL=https://anonabento.com`. `SITE_URL` in `src/lib/content.ts` reads it; without it the OG, sitemap and canonical URLs fall back to Vercel values.
- [ ] If the build picks the wrong Node version, set `NODE_VERSION=24` to match CI.
- [ ] Turn on Web Analytics for the project. Cloudflare injects it, so no code is needed.

## 4. Check the preview (`*.pages.dev`, branch deploy)
- [ ] The board loads, pans, zooms, and the boot animation runs.
- [ ] `/?project=<id>` opens the viewfinder, and a 3D tab loads its model.
- [ ] `/projects/<old-id>` returns a 301 to `/?project=<id>`.
- [ ] `/resume` opens the PDF.
- [ ] The `/projects` list loads.
- [ ] `/studio` returns 404.
- [ ] The link preview (OG image) renders. Paste the URL into a debugger such as opengraph.xyz.

## 5. Go live
- [ ] Merge to `main`.
- [ ] In Pages → Custom domains, add `anonabento.com` and `www.anonabento.com`. Add a Redirect Rule from www to the apex.
- [ ] Update the repo's homepage field and anything that still links `bento-site-sepia.vercel.app`.

## 6. Email
- [ ] In Email Routing, forward `kevin@anonabento.com` to Gmail and verify the destination.
- [ ] Send a test from another account.
- [ ] Optional: set up Gmail "Send mail as" through Gmail's SMTP so replies come from kevin@.

## 7. Turn off Vercel
- [ ] After anonabento.com has served for a day, delete the Vercel project, or disconnect its Git integration so pushes stop deploying there.

## If staying on Vercel instead
Skip steps 2–4. Point DNS at Vercel with **DNS-only (grey cloud)** records, not proxied ones.

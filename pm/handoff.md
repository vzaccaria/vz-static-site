# Session Handoff

Written: 2026-06-11 10:48 CEST
Author: Codex

## What was done this session

- Completed `vz-site.6` — Feed sitemap SEO e asset.
- Added `src/pages/feed.xml.ts` with RSS 2.0 output for all imported blog posts.
- Added `src/pages/sitemap.xml.ts` covering static routes, blog posts, and tag pages.
- Expanded `BaseLayout.astro` with canonical, RSS discovery, OpenGraph, Twitter card, and article published-time metadata.
- Made `SITE_URL` and `SITE_BASE` flow through canonical URLs, feed URLs, sitemap URLs, navigation links, and static image paths.
- Added `scripts/sync-static-assets.mjs` and `npm run assets:sync` so imported blog images are copied into ignored `public/static/blog/images/` before dev/build/preview.
- Added a Markdown image rewrite in `astro.config.mjs` so imported `images/...` blog references render as base-safe `/static/blog/images/...` URLs.
- Centralized blog post/tag URL helpers in `src/data/blog.ts`.
- Recorded memory `lesson/vz-site/static-blog-assets`.

## Current state

- `npm run check` passes when run outside the sandbox because `tsx` needs to create an IPC pipe under `/var/folders`.
- `npm run build` passes for the default preview target.
- `SITE_URL=https://vzaccaria.github.io SITE_BASE=/vz-static-site npm run build` also passes and produces base-safe canonical, feed, sitemap, navigation, CSS, avatar, and blog image URLs.
- The build still emits pre-existing Vite warnings for design-system font URLs under ignored `src/styles/ds/`; this session did not change that area.

## In progress

- None.

## Blockers & open questions

- Network access was blocked in the sandbox for automatic beads remote sync; use explicit elevated `bd dolt push` and `git push` at close.

## Recommended next steps

1. Start `vz-site.7` — Preview deploy.
2. Verify the deployed GitHub Pages project URL serves `feed.xml`, `sitemap.xml`, avatar, and rewritten blog images under `/vz-static-site/`.

## Context the next agent should know

- Do not commit `public/static/blog/images/`; it is generated and ignored.
- `SITE_URL` controls absolute SEO/feed/sitemap URLs. `SITE_BASE` controls subpath links and asset paths.
- The feed and sitemap share post/tag path logic from `src/data/blog.ts`; keep future URL changes centralized there.

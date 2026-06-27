# vz-static-site

## Purpose
Public repository for Vittorio Zaccaria's personal academic website: a fully
static site, easy to develop locally, deployable without a runtime server.
Replaces the legacy private Next.js site.

## Architecture
- Astro static/pre-rendered output ([ADR 001](adr/001-static-public-site-architecture.md)).
- Public data only: the private `../vz-personal-store` repo owns sanitization and
  exports a generated tree to `data/imported/`; this repo validates and consumes
  it ([ADR 003](adr/003-imported-public-data-contract.md)). No second sanitizer here.
- Build-time helpers: `src/data/public-content.ts` (page data), `src/data/blog.ts`
  (post/tag paths), `src/data/site.ts` (`withBasePath`, canonical URLs).
- Routes: home, bio, research, courses, theses, blog + tags, `/feed.xml`,
  `/sitemap.xml`, SEO metadata.
- Deploy: GitHub Pages via `.github/workflows/pages.yml`. Production serves
  `www.vittoriozaccaria.net` at root base; DNS at Namecheap, Vercel retired
  ([ADR 004](adr/004-production-cutover.md), supersedes ADR 001/002 DNS assumptions).

## Build & test
```bash
npm install
npm run dev
npm run build      # SITE_URL / SITE_BASE env-driven; default site = production www
npm run preview
npm run check      # data:check:strict + content:check + astro check
```
CI: `.github/workflows/ci.yml` (PR + push to main) runs `npm ci`, check, build.
Pages deploy: `.github/workflows/pages.yml` on push to main.

## Conventions
- Track work with beads, prefix `vz-site`. Use `pm/` for context/roadmap/handoff.
- Keep private data out of this repo; consume only the sanitized export.
- Use `withBasePath()` from `src/data/site.ts` for internal links/assets — never
  compute base locally. `SITE_URL` drives canonical/feed/sitemap/OG; `SITE_BASE`
  drives subpath deploys.
- Serve must-have assets from `public/`, not `data/imported/`.
- Astro telemetry disabled in npm scripts.

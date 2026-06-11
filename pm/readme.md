# vz-static-site

## Purpose
`vz-static-site` is the public repository for Vittorio Zaccaria's rebuilt personal academic website. The site should be fully static, easy to develop locally, and deployable without a runtime server.

The project replaces the legacy private Next.js website with a static-site generator workflow suitable for GitHub-hosted source and public preview/production deployments.

## Architecture
Planned architecture:

- Static-site generator: Astro in static/pre-rendered mode, accepted by
  [ADR 001](adr/001-static-public-site-architecture.md).
- Public content and generated public data live in this repository.
- Private source data remains outside this repository and is imported only
  through the sanitized export produced by `../vz-personal-store`.
- The site exposes static routes for profile, bio/research, courses, theses, blog, tags, feeds, sitemap, and SEO metadata.
- Shared build-time helpers in `src/data/public-content.ts` derive page data from the imported public tree without a runtime server.
- Shared blog helpers in `src/data/blog.ts` keep post and tag paths consistent across pages, feed, and sitemap generation.
- The avatar used by the public bio/home pages lives in `public/static/images/avatar.jpg` so it is served as a normal static asset.
- Imported blog images remain in `data/imported/blog/images/`; `npm run assets:sync` copies them to ignored `public/static/blog/images/`, and the Astro Markdown pipeline rewrites `images/...` references to `SITE_BASE`-safe `/static/blog/images/...` URLs.
- Preview deployment targets `preview.vittoriozaccaria.net`.
- Production cutover targets `www.vittoriozaccaria.net` after parity checks pass,
  with the apex domain expected to redirect to `www`.

## Tech Stack
Initial planned stack:

- Astro for SSG.
- Node/npm for local development and CI.
- Markdown/MDX for blog content.
- YAML/JSON for public CV and structured academic data.
- GitHub Actions for build, validation, and deploy.
- Dynadot planned for registrar/DNS management.

## Environments & DNS

`vz-site.0` fixes the environment contract in
[ADR 001](adr/001-static-public-site-architecture.md):

- Local: public repository only, npm workflow, no secrets required for static
  builds, and private source data kept outside the repo.
- Preview: GitHub Pages custom domain `preview.vittoriozaccaria.net`, with
  Dynadot `preview CNAME vzaccaria.github.io`.
- Temporary Pages test: GitHub Pages project URL
  `https://vzaccaria.github.io/vz-static-site/`, built with
  `SITE_BASE=/vz-static-site`. Local development remains rooted at `/`.
- Production: GitHub Pages custom domain `www.vittoriozaccaria.net`, with
  Dynadot `www CNAME vzaccaria.github.io` and apex `A` records pointing to
  GitHub Pages.
- No wildcard DNS records. Preserve unrelated DNS such as mail records.

## Build & Run
Local commands:

```bash
npm install
npm run dev
npm run assets:sync
npm run build
npm run preview
npm run check
npm run data:check
npm run data:check:strict
npm run content:check
```

The Astro scaffold and npm toolchain were added by `vz-site.1`. `npm run build`
emits static files in `dist/`; no runtime server is required for deployment.
The public data handoff was added by `vz-site.2`; the private repo exports a
sanitized generated tree to `data/imported/`, and this repo validates that tree.
The content model added by `vz-site.3` lives in `src/data/content-model.ts` and
is enforced by `npm run content:check` and `npm run check`.
`vz-site.4` added the shared static views, the build-time public content helper,
and the local avatar asset fallback.
`vz-site.6` added RSS feed and sitemap endpoints, OpenGraph/Twitter metadata,
and the generated static blog image asset sync.

The CI workflow in `.github/workflows/ci.yml` runs on pull requests and pushes
to `main`, installs with `npm ci`, then runs `npm run check` and
`npm run build`.

## Key Conventions
- Track work with beads in this repository, using IDs prefixed `vz-site`.
- Use `pm/` for stable project context, roadmap, and session handoff.
- Keep private data out of the public repository. Data import must consume the
  sanitized allowlist export from `../vz-personal-store`; do not add a second
  sanitizer here.
- Preserve current website routes where practical, using the audit in the private repo at `website/docs/audit.md` as migration reference.
- Keep assets that must be served reliably by Astro in `public/`, not in `data/imported/`.
- Astro telemetry is disabled in npm scripts so local agent runs do not need to
  write outside the repository.
- Always use `withBasePath()` from `src/data/site.ts` for internal links and
  asset paths — never compute `basePath` locally in pages. Required for correct
  behaviour when `SITE_BASE=/vz-static-site/` (GitHub Pages project deploy).
- Use `SITE_URL` for canonical/feed/sitemap/OG URL targets and `SITE_BASE` for
  subpath deployments. Validate both the default preview build and the
  `SITE_URL=https://vzaccaria.github.io SITE_BASE=/vz-static-site` build when
  changing URLs or static asset paths.

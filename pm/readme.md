# vz-static-site

## Purpose
`vz-static-site` is the public repository for Vittorio Zaccaria's rebuilt personal academic website. The site should be fully static, easy to develop locally, and deployable without a runtime server.

The project replaces the legacy private Next.js website with a static-site generator workflow suitable for GitHub-hosted source and public preview/production deployments.

## Architecture
Planned architecture:

- Static-site generator: Astro in static/pre-rendered mode, accepted by
  [ADR 001](adr/001-static-public-site-architecture.md).
- Public content and generated public data live in this repository.
- Private source data remains outside this repository and is imported only through an explicit sanitization/export pipeline.
- The site exposes static routes for profile, bio/research, courses, theses, blog, tags, feeds, sitemap, and SEO metadata.
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

`vz-site0` fixes the environment contract in
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
npm run build
npm run preview
npm run check
```

The Astro scaffold and npm toolchain were added by `vz-site1`. `npm run build`
emits static files in `dist/`; no runtime server is required for deployment.

The CI workflow in `.github/workflows/ci.yml` runs on pull requests and pushes
to `main`, installs with `npm ci`, then runs `npm run check` and
`npm run build`.

## Key Conventions
- Track work with beads in this repository, using IDs prefixed `vz-site`.
- Use `pm/` for stable project context, roadmap, and session handoff.
- Keep private data out of the public repository. Data import must use an allowlist-based sanitization pipeline.
- Preserve current website routes where practical, using the audit in the private repo at `website/docs/audit.md` as migration reference.
- Astro telemetry is disabled in npm scripts so local agent runs do not need to
  write outside the repository.

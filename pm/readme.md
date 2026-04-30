# vz-static-site

## Purpose
`vz-static-site` is the public repository for Vittorio Zaccaria's rebuilt personal academic website. The site should be fully static, easy to develop locally, and deployable without a runtime server.

The project replaces the legacy private Next.js website with a static-site generator workflow suitable for GitHub-hosted source and public preview/production deployments.

## Architecture
Planned architecture:

- Static-site generator, expected to be Astro unless an ADR supersedes this decision.
- Public content and generated public data live in this repository.
- Private source data remains outside this repository and is imported only through an explicit sanitization/export pipeline.
- The site exposes static routes for profile, bio/research, courses, theses, blog, tags, feeds, sitemap, and SEO metadata.
- Preview deployment targets `preview.vittoriozaccaria.net` or an equivalent temporary preview URL.
- Production cutover targets `www.vittoriozaccaria.net` after parity checks pass.

## Tech Stack
Initial planned stack:

- Astro for SSG.
- Node/npm for local development and CI.
- Markdown/MDX for blog content.
- YAML/JSON for public CV and structured academic data.
- GitHub Actions for build, validation, and deploy.
- Dynadot planned for registrar/DNS management.

## Build & Run
Expected commands after scaffold:

```bash
npm install
npm run dev
npm run build
npm run preview
npm run check
```

These commands do not exist yet; `vz-site1` owns the initial scaffold and toolchain.

## Key Conventions
- Track work with beads in this repository, using IDs prefixed `vz-site`.
- Use `pm/` for stable project context, roadmap, and session handoff.
- Keep private data out of the public repository. Data import must use an allowlist-based sanitization pipeline.
- Preserve current website routes where practical, using the audit in the private repo at `website/docs/audit.md` as migration reference.

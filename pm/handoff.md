# Session Handoff

Written: 2026-05-31 17:42 CEST
Author: Codex

## What was done this session

- Claimed and closed `vz-site2`.
- Added the allowlisted public data pipeline:
  `scripts/sync-public-data.mjs`, `data/public-data.allowlist.json`,
  `src/data/generated/public-data.json`, and
  `docs/public-data-pipeline.md`.
- Added npm scripts `data:sync`, `data:sync:example`, and `data:check`.
- Updated `npm run check` so CI validates generated public data before
  `astro check`.
- Added [ADR 003](adr/003-allowlisted-public-data-pipeline.md) for the
  public/private data boundary.
- Updated `README.md`, `CLAUDE.md`, `pm/readme.md`, and `pm/plan.md`.
- Added `vz-site12` for the temporary GitHub Pages project deploy test.
- Added `.github/workflows/pages.yml` to publish `dist/` with GitHub Pages
  Actions on push to `main` and manual dispatch.
- Made Astro `site` and `base` configurable with `SITE_URL` and `SITE_BASE`.
- Made root links and the favicon base-aware for the project URL
  `https://vzaccaria.github.io/vz-static-site/`.
- Removed the stale `www.vittoriozaccaria.net` custom domain from the
  `vzaccaria.github.io` GitHub Pages repository and documented the decision in
  [ADR 002](adr/002-github-pages-project-preview-routing.md).
- Claimed and closed `vz-site1`.
- Added the Astro 6 static scaffold with npm scripts, strict TypeScript config,
  `src/pages`, `src/layouts`, `src/styles`, `src/content`, and `src/data`.
- Added a minimal public homepage, 404 page, favicon, root `README.md`,
  `.node-version`, and GitHub Actions CI.
- Updated `pm/readme.md`, `pm/plan.md`, and `CLAUDE.md` with the working
  commands and scaffold conventions.
- Created `vz-site10` to track the current dev-only `@astrojs/check` YAML audit
  advisory.
- Created `vz-site11` to track the beads issue-prefix mismatch discovered during
  issue creation.

## Current state

- The public data pipeline refuses to run without an explicit `--source` path.
- The safe fixture `data/private-export.example.json` demonstrates that fake
  private fields are stripped before writing
  `src/data/generated/public-data.json`.
- `npm run data:check`, `npm run data:sync:example`, `npm run data:sync --
  --source data/private-export.example.json --dry-run`, and `npm run ci` pass.
- The temporary GitHub Pages deploy workflow builds with
  `SITE_URL=https://vzaccaria.github.io` and `SITE_BASE=/vz-static-site`.
- Local development still defaults to `/`.
- `www.vittoriozaccaria.net` still returns HTTP 200 from Vercel after removing
  the GitHub Pages custom-domain mapping.
- `https://vzaccaria.github.io/vz-static-site/` returns HTTP 200 from GitHub
  Pages.
- `npm ci` works from `package-lock.json`.
- `npm run check`, `npm run build`, and `npm run ci` pass.
- `npm run dev` served `http://127.0.0.1:4321/` and `npm run preview` served
  `http://127.0.0.1:4322/`; both were verified with `curl` and stopped.
- The Pages-style preview was also verified locally at
  `http://127.0.0.1:4324/vz-static-site/`.
- Astro warns that `src/content/blog` has no markdown files yet. This is
  expected until real public content is imported.

## In progress

- None.

## Blockers & open questions

- `vz-site3` should become ready after `vz-site2` is closed.
- `npm audit` reports 5 moderate dev-only vulnerabilities through
  `@astrojs/check`; `npm audit --omit=dev` reports 0 vulnerabilities. Do not run
  `npm audit fix --force` casually because it would downgrade `@astrojs/check`.
- `bd create` has a prefix mismatch: config uses `vz-static-site`, but existing
  issues use `vz-site*`. See `vz-site11`.

## Recommended next steps

1. Start `vz-site3` and build content model validation on top of
   `src/data/generated/public-data.json`.
2. Resolve `vz-site11` soon so future issue intake does not require explicit
   forced IDs.
3. Revisit `vz-site10` when upstream Astro tooling has a non-breaking audit fix.

## Context the next agent should know

- The private repo `vz-personal-store` contains the legacy website audit at
  `website/docs/audit.md`; use it for route parity later.
- Private data must never be copied wholesale into this public repo.
- DNS expectations are in ADR 001; do not use wildcard DNS records and preserve
  unrelated records such as mail `MX`/`TXT` entries.

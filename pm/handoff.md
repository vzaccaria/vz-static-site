# Session Handoff

Written: 2026-05-29 17:07 CEST
Author: Codex

## What was done this session

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

- `npm ci` works from `package-lock.json`.
- `npm run check`, `npm run build`, and `npm run ci` pass.
- `npm run dev` served `http://127.0.0.1:4321/` and `npm run preview` served
  `http://127.0.0.1:4322/`; both were verified with `curl` and stopped.
- Astro warns that `src/content/blog` has no markdown files yet. This is
  expected until real public content is imported.

## In progress

- None.

## Blockers & open questions

- `vz-site3` is now blocked only by `vz-site2`.
- `npm audit` reports 5 moderate dev-only vulnerabilities through
  `@astrojs/check`; `npm audit --omit=dev` reports 0 vulnerabilities. Do not run
  `npm audit fix --force` casually because it would downgrade `@astrojs/check`.
- `bd create` has a prefix mismatch: config uses `vz-static-site`, but existing
  issues use `vz-site*`. See `vz-site11`.

## Recommended next steps

1. Start `vz-site2` and define the allowlist-based public data export pipeline.
2. Resolve `vz-site11` soon so future issue intake does not require explicit
   forced IDs.
3. Revisit `vz-site10` when upstream Astro tooling has a non-breaking audit fix.

## Context the next agent should know

- The private repo `vz-personal-store` contains the legacy website audit at
  `website/docs/audit.md`; use it for route parity later.
- Private data must never be copied wholesale into this public repo.
- DNS expectations are in ADR 001; do not use wildcard DNS records and preserve
  unrelated records such as mail `MX`/`TXT` entries.

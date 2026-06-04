# Session Handoff

Written: 2026-06-04 19:30 CEST
Author: Codex

## What was done this session

- Implemented the core static views for the public site in `vz-site.4`.
- Added static routes for home, bio, research, courses, and theses.
- Introduced `src/data/public-content.ts` to derive build-time page data from
  the imported public tree.
- Added `public/static/images/avatar.jpg` and switched the home/bio views to use
  that local asset instead of the broken Dropbox URL.
- Verified the site with `npm run check` and `npm run build`.
- Committed the work locally as `6ca657c Implement core static views`.

## Current state

- `vz-site.4` is complete in the local repository state.
- `bd blocked` still reports the downstream chain:
  `vz-site.6` blocked by `vz-site.4` and `vz-site.5`, then `vz-site.7`,
  `vz-site.8`, and `vz-site.9`.
- The avatar asset responds correctly at `/static/images/avatar.jpg`.
- No implementation work remains in progress.

## In progress

- None.

## Blockers & open questions

- `npm audit` reports moderate dev-only vulnerabilities through
  `@astrojs/check`; `npm audit --omit=dev` reports 0 vulnerabilities. Do not run
  `npm audit fix --force` casually because it would downgrade `@astrojs/check`.

## Recommended next steps

1. Start `vz-site.5` for blog, tags, and URL compatibility.
2. Continue with `vz-site.6` once `vz-site.5` is in place.
3. Revisit `vz-site.10` when upstream Astro tooling has a non-breaking audit fix.

## Context the next agent should know

- Keep using the dotted numbered convention `vz-site.<n>` for numbered issues;
  the root epic remains `vz-site`.
- The private repo `vz-personal-store` contains the legacy website audit at
  `website/docs/audit.md`; use it for route parity later.
- Private data must never be copied wholesale into this public repo.
- DNS expectations are in ADR 001; do not use wildcard DNS records and preserve
  unrelated records such as mail `MX`/`TXT` entries.

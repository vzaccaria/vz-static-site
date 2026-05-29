# Session Handoff

Written: 2026-05-29 14:56 CEST
Author: Codex

## What was done this session

- Claimed and closed `vz-site0`.
- Added [ADR 001](adr/001-static-public-site-architecture.md) accepting a
  separate public static-site repo, Astro static output, npm, GitHub Actions to
  GitHub Pages, and Dynadot-managed DNS.
- Documented local, preview, and production environment contracts in
  `pm/readme.md`.
- Updated `pm/plan.md` so `vz-site1` and `vz-site2` are the next planned work.

## Current state

- No Astro scaffold exists yet.
- `vz-site1` and `vz-site2` are now ready; `vz-site3` remains blocked until both
  are complete.
- `git diff --check` passed for the documentation changes.

## In progress

- None.

## Blockers & open questions

- No active bead is in progress.
- Preview and production are documented as two phases for the same GitHub Pages
  site. If simultaneous long-lived custom domains are needed after cutover, add
  a follow-up ADR for a second Pages site or another static host.

## Recommended next steps

1. Start `vz-site1` and scaffold Astro/npm/GitHub Pages tooling from ADR 001.
2. Start `vz-site2` and define the allowlist-based public data export pipeline.
3. Keep private source data outside this public repository.

## Context the next agent should know

- The private repo `vz-personal-store` contains the legacy website audit at
  `website/docs/audit.md`; use it for route parity later.
- Private data must never be copied wholesale into this public repo.
- DNS expectations are in ADR 001; do not use wildcard DNS records and preserve
  unrelated records such as mail `MX`/`TXT` entries.

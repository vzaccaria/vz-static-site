# Development Plan

Last updated: 2026-05-29

## Active epics

### 1. Nuovo sito statico pubblico (`vz-site`)
**Why:** The personal website should be rebuilt as a fully static public site with a simple local workflow, safe public data import, preview deployment, and a controlled production cutover to `www.vittoriozaccaria.net`.

**Scope:** Build the new public `vz-static-site` repository, define the architecture, scaffold the SSG toolchain, implement an allowlist-based public data pipeline, reproduce the current views, generate feeds/sitemap/SEO, deploy preview, check parity with the existing site, and perform production cutover.

**Status:** Open. `vz-site0` accepted the initial architecture and environment
contract in ADR 001. `vz-site1` added the Astro/npm scaffold and CI. `vz-site2`
is the next major ready item for the public data pipeline. `vz-site12` adds a
temporary GitHub Pages project deploy for early testing before the later custom
preview domain deploy.

## Planned sequence

1. `vz-site2` - Pipeline dati pubblici sanitizzati
2. `vz-site3` - Content model e validazione
3. `vz-site4` - Viste statiche core
4. `vz-site5` - Blog, tag e compatibilita URL
5. `vz-site6` - Feed sitemap SEO e asset
6. `vz-site7` - Preview deploy
7. `vz-site8` - Parity check con sito attuale
8. `vz-site9` - Cutover produzione

## Parked / future
- Framework alternatives to Astro - only revisit if `vz-site0` finds a concrete blocker.
- Production cutover details - defer until preview and parity checks are complete.
- `vz-site10` tracks the current dev-only `@astrojs/check` audit advisory until
  upstream has a non-breaking fix.
- `vz-site11` tracks the beads issue-prefix mismatch discovered during new issue
  intake.
- `vz-site12` tracks the temporary GitHub Pages project URL deploy test:
  `https://vzaccaria.github.io/vz-static-site/`.
- [ADR 002](adr/002-github-pages-project-preview-routing.md) records the
  decision to remove the old GitHub Pages custom-domain mapping from
  `vzaccaria.github.io` while keeping `www.vittoriozaccaria.net` on the current
  production host.

## Completed (recent)
- `vz-site1` - Scaffold Astro e toolchain locale, completed 2026-05-29 with
  Astro 6, npm scripts, `src/content`, `src/data`, static pages, and CI.
- `vz-site0` - Decisione architetturale e setup ambienti, completed 2026-05-29
  with [ADR 001](adr/001-static-public-site-architecture.md).

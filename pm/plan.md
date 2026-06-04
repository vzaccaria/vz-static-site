# Development Plan

Last updated: 2026-06-04

## Active epics

### 1. Nuovo sito statico pubblico (`vz-site`)
**Why:** The personal website should be rebuilt as a fully static public site with a simple local workflow, safe public data import, preview deployment, and a controlled production cutover to `www.vittoriozaccaria.net`.

**Scope:** Build the new public `vz-static-site` repository, define the architecture, scaffold the SSG toolchain, consume the sanitized public data export from the private repo, reproduce the current views, generate feeds/sitemap/SEO, deploy preview, check parity with the existing site, and perform production cutover.

**Status:** Open. `vz-site.0` accepted the initial architecture and environment
contract in ADR 001. `vz-site.1` added the Astro/npm scaffold and CI. `vz-site.2`
now consumes the sanitized `data/imported/` tree from the private repo, as
recorded in ADR 003. `vz-site.3` adds strict public content schemas and CI
validation for the imported tree. `vz-site.12` adds a temporary GitHub Pages
project deploy for early testing before the later custom preview domain deploy.
`vz-site.4` is next for the core static views.

## Planned sequence

1. `vz-site.4` - Viste statiche core
2. `vz-site.5` - Blog, tag e compatibilita URL
3. `vz-site.6` - Feed sitemap SEO e asset
4. `vz-site.7` - Preview deploy
5. `vz-site.8` - Parity check con sito attuale
6. `vz-site.9` - Cutover produzione

## Parked / future
- Framework alternatives to Astro - only revisit if `vz-site.0` finds a concrete blocker.
- Production cutover details - defer until preview and parity checks are complete.
- `vz-site.10` tracks the current dev-only `@astrojs/check` audit advisory until
  upstream has a non-breaking fix.
- `vz-site.12` tracks the temporary GitHub Pages project URL deploy test:
  `https://vzaccaria.github.io/vz-static-site/`.
- [ADR 002](adr/002-github-pages-project-preview-routing.md) records the
  decision to remove the old GitHub Pages custom-domain mapping from
  `vzaccaria.github.io` while keeping `www.vittoriozaccaria.net` on the current
  production host.

## Completed (recent)
- `vz-site.11` - Beads issue-prefix alignment and ID migration, completed
  2026-06-04 by setting database `issue_prefix` to `vz-site`, migrating the
  numbered series to `vz-site.0` through `vz-site.15`, and verifying the dotted
  issue convention.
- `vz-site.3` - Content model e validazione, completed 2026-06-01 with strict
  Zod schemas, imported blog/author Astro collections, and CI validation for
  `data/imported/`.
- `vz-site.2` - Pipeline dati pubblici sanitizzati, completed 2026-05-31 and
  corrected 2026-06-01 with
  [ADR 003](adr/003-imported-public-data-contract.md): the private repo owns
  sanitization, this repo validates/consumes `data/imported/`.
- `vz-site.1` - Scaffold Astro e toolchain locale, completed 2026-05-29 with
  Astro 6, npm scripts, `src/content`, `src/data`, static pages, and CI.
- `vz-site.0` - Decisione architetturale e setup ambienti, completed 2026-05-29
  with [ADR 001](adr/001-static-public-site-architecture.md).

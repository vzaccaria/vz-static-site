# Development Plan

Last updated: 2026-05-29

## Active epics

### 1. Nuovo sito statico pubblico (`vz-site`)
**Why:** The personal website should be rebuilt as a fully static public site with a simple local workflow, safe public data import, preview deployment, and a controlled production cutover to `www.vittoriozaccaria.net`.

**Scope:** Build the new public `vz-static-site` repository, define the architecture, scaffold the SSG toolchain, implement an allowlist-based public data pipeline, reproduce the current views, generate feeds/sitemap/SEO, deploy preview, check parity with the existing site, and perform production cutover.

**Status:** Open. `vz-site0` accepted the initial architecture and environment
contract in ADR 001. `vz-site1` and `vz-site2` are next once the decision bead
is closed.

## Planned sequence

1. `vz-site1` - Scaffold Astro e toolchain locale
2. `vz-site2` - Pipeline dati pubblici sanitizzati
3. `vz-site3` - Content model e validazione
4. `vz-site4` - Viste statiche core
5. `vz-site5` - Blog, tag e compatibilita URL
6. `vz-site6` - Feed sitemap SEO e asset
7. `vz-site7` - Preview deploy
8. `vz-site8` - Parity check con sito attuale
9. `vz-site9` - Cutover produzione

## Parked / future
- Framework alternatives to Astro - only revisit if `vz-site0` finds a concrete blocker.
- Production cutover details - defer until preview and parity checks are complete.

## Completed (recent)
- `vz-site0` - Decisione architetturale e setup ambienti, completed 2026-05-29
  with [ADR 001](adr/001-static-public-site-architecture.md).

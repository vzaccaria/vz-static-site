# Development Plan

Last updated: 2026-04-30

## Active epics

### 1. Nuovo sito statico pubblico (`vz-site`)
**Why:** The personal website should be rebuilt as a fully static public site with a simple local workflow, safe public data import, preview deployment, and a controlled production cutover to `www.vittoriozaccaria.net`.

**Scope:** Build the new public `vz-static-site` repository, define the architecture, scaffold the SSG toolchain, implement an allowlist-based public data pipeline, reproduce the current views, generate feeds/sitemap/SEO, deploy preview, check parity with the existing site, and perform production cutover.

**Status:** Open. Initial beads are created as `vz-site0` through `vz-site9`. `vz-site0` is the first ready item.

## Planned sequence

1. `vz-site0` - Decisione architetturale e setup ambienti
2. `vz-site1` - Scaffold Astro e toolchain locale
3. `vz-site2` - Pipeline dati pubblici sanitizzati
4. `vz-site3` - Content model e validazione
5. `vz-site4` - Viste statiche core
6. `vz-site5` - Blog, tag e compatibilita URL
7. `vz-site6` - Feed sitemap SEO e asset
8. `vz-site7` - Preview deploy
9. `vz-site8` - Parity check con sito attuale
10. `vz-site9` - Cutover produzione

## Parked / future
- Framework alternatives to Astro - only revisit if `vz-site0` finds a concrete blocker.
- Production cutover details - defer until preview and parity checks are complete.

## Completed (recent)
- None.

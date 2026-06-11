# Development Plan

Last updated: 2026-06-11 (vz-ds.5 closed — vz-ds adoption complete)

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
`vz-site.4` implements the core static views and the local avatar fallback.
`vz-site.5` added blog listing, individual post pages, tag index, and tag
detail pages. `vz-site.6` completed 2026-06-11 with RSS feed, sitemap,
canonical/OG/Twitter metadata, configurable preview/project URLs, and static
blog image asset rewrites. The next step is `vz-site.7`.

### 2. Adozione design system (`vz-ds`)

**Why:** il sito usa attualmente una palette teal `#1b6f6a` divergente dalla
direzione AOS Lab datasheet decisa in
`../vz-personal-store/design-system/adr/0001-direction-datasheet.md`. Il
monorepo ora espone un flusso pull-based stabile (epic `v-ds` chiuso
2026-06-05) e una skill `aos-lab-design` che documenta come consumare
i token. Adottare i token converge il sito sulla stessa identità visiva
di curriculum e materiale-corsi.

**Scope (in):**
- `scripts/sync-ds.sh` che invoca `node $DS_ROOT/scripts/build.mjs` e copia
  `tokens.css`, `fonts.css`, `fonts/` in `src/styles/ds/`.
- Wiring import in `src/layouts/BaseLayout.astro`.
- Sostituzione palette teal → `var(--ds-colors-accent)` (#1756e0).
- Sostituzione font corrente → IBM Plex Sans/Mono/Serif via `var(--ds-fonts-*)`.
- Pin documentato (git SHA monorepo vz-personal-store).

**Scope (out):**
- Restyle UI completo oltre i token (eventualmente epic separato dopo `vz-ds.1`).
- Modifiche al monorepo design-system (consumer-only adoption).

**Status:** open. Adozione strutturata in 5 fasi sequenziali con catena di
dipendenze stretta. **`vz-ds.1` completed 2026-06-11** — pull infrastructure in place.
**`vz-ds.2` completed 2026-06-11** — typography baseline implemented.
**`vz-ds.3` completed 2026-06-11** — accent palette swap implemented.
**`vz-ds.4` completed 2026-06-11** — shape conventions enforced (zero radii,
zero shadows, ink borders via `--ds-border_width-bw1/bw3` tokens).
**`vz-ds.5` completed 2026-06-11** — datasheet voice: mono uppercase labels
with `--ds-tracking-label`, `§N` section markers in accent on page headings,
heading scale downsized (h1 max 2.6rem, was 8rem), profile photo capped at
200px square. Epic `vz-ds` complete.

**Planned sequence (vz-ds):**

1. `vz-ds.1` — Pull infrastructure (sync-ds.sh + import in BaseLayout). **Completed 2026-06-11.**
2. `vz-ds.2` — Typography baseline (IBM Plex Sans/Mono/Serif). **Completed 2026-06-11.** Depends on `.1`.
3. `vz-ds.3` — Accent palette swap (teal `#1b6f6a` → blue `#1756e0`). **Completed 2026-06-11.** Depends on `.2`.
4. `vz-ds.4` — Shape conventions (zero radii, zero shadows, borders 1/2/3 px ink). **Completed 2026-06-11.** Depends on `.3`.
5. `vz-ds.5` — Datasheet voice (mono labels uppercase, section markers `§N`). **Completed 2026-06-11.** Depends on `.4`.

### 3. Styling nit-picks post vz-ds (`vz-site-gge`)

**Why:** dopo la chiusura di `vz-ds.5` l'utente ha segnalato 5 rifiniture stilistiche
(blog title wrap, bio degrees card height, research sub-area gray boxes,
courses card height, theses markdown not rendered). Rifiniture cosmetiche,
non blockers, ma da chiudere prima del preview deploy per non spostare il debito visivo.

**Scope:** vz-site-gge.1 → .5 (uno per pagina/difetto).

**Status:** closed, completed 2026-06-11.

## Planned sequence

1. `vz-site.7` - Preview deploy
2. `vz-site.8` - Parity check con sito attuale
3. `vz-site.9` - Cutover produzione

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
- `vz-site-gge` - Styling nit-picks (5 bug, polish post vz-ds.5), completed 2026-06-11 with all 5 child beads closed.
- `vz-site.6` - Feed sitemap SEO e asset, completed 2026-06-11 with valid
  `feed.xml` and `sitemap.xml`, shared URL helpers, OpenGraph/Twitter metadata,
  `SITE_URL`/`SITE_BASE`-safe canonical URLs, and generated static copies of
  imported blog images.
- `vz-site.5` - Blog, tag e compatibilita URL, completed 2026-06-10 with blog
  listing, individual post pages, tag index, and tag detail pages backed by
  Astro content collections from `data/imported/blog/`.
- `vz-site.4` - Viste statiche core, completed 2026-06-04 with static home,
  bio, research, courses, and theses routes, responsive shared layout, and a
  local avatar fallback asset.
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

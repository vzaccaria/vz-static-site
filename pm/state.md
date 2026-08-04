# vz-static-site — State

Updated: 2026-08-04

## Roadmap

Active (children + detail in bd; run `bd show <id>`):
1. `vz-site-csn` (P3) — Updates sito: pagina laboratorio. Merge research + theses
   into a "Lab & theses" virtual lab page. Open: not started.

Parked: alternative SSG frameworks (revisit only on a concrete Astro blocker).

## Handoff

Written: 2026-08-04 12:22 CEST · OpenAI Codex

Done: epic `vz-site-adx` complete (4/4): validated AOS snapshots generate static
2025-2026 and 2026-2027 routes, and `/courses/` links the matching local edition.
`vz-site-dpj` adds `make sync`, which runs the personal-store `export-site`
workflow followed by `npm run courses:sync`.

State: working. `make sync` completed end-to-end with 49 sanitized exported files
and 2 AOS manifests. `npm run ci` passes: content/course validation, Astro
diagnostics, 2 manifest tests, and 37-page static build. Browser smoke for the
AOS pages and registry previously passed at desktop/mobile widths.

Next: 1) `vz-site-csn` — Lab & theses page. 2) Populate the 2026-2027 manifest in
`materiale-corsi`, then run `make sync`.

Gotchas: both source repositories must be sibling directories for `make sync`.
`data/imported/` and `data/course-manifests/` are generated snapshots; never edit
them by hand. Registry matching uses exact course title + academic year and keeps
the imported external link as fallback. Blockers: none.

# vz-static-site — State

Updated: 2026-08-04

## Roadmap

Active (children + detail in bd; run `bd show <id>`):
1. `vz-site-csn` (P3) — Updates sito: pagina laboratorio. Merge research + theses
   into a "Lab & theses" virtual lab page. Open: not started.

Parked: alternative SSG frameworks (revisit only on a concrete Astro blocker).

## Handoff

Written: 2026-08-04 12:13 CEST · OpenAI Codex

Done: epic `vz-site-adx` complete (4/4). AOS manifests now sync from
`../materiale-corsi`, validate in CI, and generate static 2025-2026 and
2026-2027 routes with resources, schedule, links, archive navigation, and
responsive styling. `/courses/` links the matching AOS edition locally.

State: working. `npm run ci` passes: content/course validation, Astro diagnostics,
2 manifest tests, and 37-page static build. Browser smoke passed for both AOS
editions and the registry at desktop/mobile widths, with no horizontal overflow.

Next: 1) `vz-site-csn` — Lab & theses page. 2) Populate the 2026-2027 manifest in
`materiale-corsi`, then run `npm run courses:sync` here.

Gotchas: `materiale-corsi` is source of truth; committed
`data/course-manifests/` snapshots make CI independent of the sibling checkout.
The registry chooses a local page by exact course title + academic year and keeps
the imported external link as fallback. Blockers: none.

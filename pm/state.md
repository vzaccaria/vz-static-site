# vz-static-site — State

Updated: 2026-08-05

## Roadmap

Active (children + detail in bd; run `bd show <id>`):
1. `vz-site-csn` (P3) — Updates sito: pagina laboratorio. Merge research + theses
   into a "Lab & theses" virtual lab page. Open: not started.

Parked: alternative SSG frameworks (revisit only on a concrete Astro blocker).

## Handoff

Written: 2026-08-05 10:24 CEST · OpenAI Codex

Done: AOS edition pages and unified `make sync` are live. `vz-site-87r` adds an
accessible detailed/compact schedule toggle. Compact desktop events use one row
with Slides/Notes direct-download actions and Recording access; mobile actions
wrap without horizontal overflow. Course administration slides moved to Course
information in the canonical 2025-2026 manifest.

State: working. `materiale-corsi/aos/website` passes 8 tests. `npm run ci` passes
course/content validation, Astro diagnostics, 2 tests, and 37-page static build.
Browser smoke covered toggle state, row alignment, download targets, recording
links, empty schedules, and desktop/mobile overflow.

Next: 1) `vz-site-csn` — Lab & theses page. 2) Populate the 2026-2027 manifest in
`materiale-corsi`, then run `make sync`.

Gotchas: source repositories must be siblings for `make sync`; generated
snapshots are read-only. Quick actions are selected by `slides-`, `notes-`, and
`recording-` IDs; Drive file URLs become direct-download URLs. Teaching material
is suppressed only when an edition has schedule events. Blockers: none.

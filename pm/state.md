# vz-static-site — State

Updated: 2026-08-04

## Roadmap

Active (children + detail in bd; run `bd show <id>`):
1. `vz-site-csn` (P3) — Updates sito: pagina laboratorio. Merge research + theses
   into a "Lab & theses" virtual lab page. Open: not started.

Parked: alternative SSG frameworks (revisit only on a concrete Astro blocker).

## Handoff

Written: 2026-08-04 12:35 CEST · OpenAI Codex

Done: epic `vz-site-adx` complete; `vz-site-dpj` adds unified `make sync`.
`vz-site-vvf` simplifies AOS resource presentation: three desktop columns,
removes repeated counts, promotes GitHub repositories and project registration,
and hides archived teaching materials already represented by the schedule.

State: working. The empty-schedule 2026-2027 edition still exposes its teaching
material. Promoted links are removed from the external-links section to avoid
duplication. `npm run ci` passes: validation, Astro diagnostics, 2 tests, and
37-page build. Desktop/mobile browser smoke passed with no overflow.

Next: 1) `vz-site-csn` — Lab & theses page. 2) Populate the 2026-2027 manifest in
`materiale-corsi`, then run `make sync`.

Gotchas: source repositories must be siblings for `make sync`; generated data
snapshots are read-only. Teaching material is suppressed only when an edition
has schedule events. Registry matching uses exact title + academic year and
keeps the imported external link as fallback. Blockers: none.

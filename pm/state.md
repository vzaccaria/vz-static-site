# vz-static-site — State

Updated: 2026-08-26

## Roadmap

Active (children + detail in bd; run `bd show <id>`):
1. `vz-site-csn` (P3) — Updates sito: pagina laboratorio. Merge research + theses
   into a "Lab & theses" virtual lab page. Open: not started.

Parked: alternative SSG frameworks (revisit only on a concrete Astro blocker).

## Handoff

Written: 2026-08-26 09:00 CEST · OpenAI Codex

Done: `vz-site-hu0.1` splits the course registry into lead-instructor and
teaching-assistant tables. Assistant rows show hours and lead instructor, and
exclude courses led by Vittorio Zaccaria.

State: working. `npm run ci` passes imported-data/content/course validation,
Astro diagnostics, 2 tests, and the 37-page static build. Browser smoke verifies
25 lead rows, 19 assistant rows, no Vittorio-led assistant entries, and contained
horizontal table scrolling on mobile without page overflow.

Next: 1) `vz-site-csn` — Lab & theses page. 2) Populate the 2026-2027 manifest in
`materiale-corsi`, then run `make sync`.

Gotchas: course roles come from imported `position`; the assistant filter compares
`titolare` with `publicCv.basics.name`. Source repositories must be siblings for
`make sync`. Blockers: none.

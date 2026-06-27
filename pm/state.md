# vz-static-site — State

Updated: 2026-06-27

## Roadmap

Active (children + detail in bd; run `bd show <id>`):
1. `vz-site` — Nuovo sito statico pubblico. Static public rebuild + production
   cutover. Open: `vz-site.9` cutover **prepared** — repo changes committed
   locally (CNAME, prod root build, default site=www, ADR 004); awaiting push +
   Namecheap DNS flip + Vercel decommission, then verify and close.
2. `vz-site-csn` (P3) — Updates sito: pagina laboratorio. Merge research + theses
   into a "Lab & theses" virtual lab page. Open: not started.

Parked: alternative SSG frameworks (revisit only on a concrete Astro blocker).

## Handoff

Written: 2026-06-27 17:35 CEST · Claude

Done: `vz-site.9` Part A (in-repo) prepared and committed locally — `public/CNAME`
= www, `pages.yml` production build (`SITE_URL=https://www.vittoriozaccaria.net`,
no `SITE_BASE`), default `site` in `astro.config.mjs` + fallback in
`src/data/site.ts` set to production www, and [ADR 004](adr/004-production-cutover.md)
(final DNS, rollback, verification). Root-base build verified clean (`npm run check`
0 errors; no `/vz-static-site` references).

State: working; cutover **not executed** — not pushed, DNS still on Vercel NS.

Next: 1) `git push` main → triggers Pages deploy, claims `www`, retires the
`vzaccaria.github.io/vz-static-site/` preview URL (this push IS the cutover
trigger). 2) At Namecheap: switch NS Vercel→BasicDNS + records per ADR 004.
3) Enable Enforce HTTPS, remove/park the Vercel Next site, run the ADR 004
verification, then `bd close vz-site.9`.

Gotchas: pre-cutover DNS captured in ADR 004 for rollback (NS ns1/ns2.vercel-dns.com;
www A 76.76.21.22/66.33.60.66; apex A 76.76.21.241/76.76.21.61). Keep the old
Vercel site parked, not deleted, until prod is verified stable.

Blockers: DNS flip + Vercel decommission need the user (Namecheap/Vercel dashboards).

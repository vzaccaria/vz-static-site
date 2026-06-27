# vz-static-site — State

Updated: 2026-06-27

## Roadmap

Active (children + detail in bd; run `bd show <id>`):
1. `vz-site-csn` (P3) — Updates sito: pagina laboratorio. Merge research + theses
   into a "Lab & theses" virtual lab page. Open: not started.

Parked: alternative SSG frameworks (revisit only on a concrete Astro blocker).

## Handoff

Written: 2026-06-27 21:20 CEST · Claude

Done: Epic `vz-site` **complete and closed** (7/7). `vz-site.9` production cutover:
root build live on GitHub Pages at https://www.vittoriozaccaria.net (apex 301→www),
Namecheap BasicDNS (apex A → GitHub IPs, www CNAME → vzaccaria.github.io), Let's
Encrypt cert + Enforce HTTPS. `vz-site.17`: legacy `vzaccaria.github.io` account repo
now redirects to www (.nojekyll + redirect index.html/404.html; old Jekyll site
retired). ADR 004 records final DNS, rollback, verification.

State: production live and verified. Only `vz-site-csn` remains (not started).

Next: 1) `vz-site-csn` — Lab & theses page. 2) Optional hygiene: remove `www` from
the old Vercel project once soaked (keep parked, not deleted, per ADR 004).

Gotchas: cert was stuck ~2h despite correct config; the fix was toggling the Pages
custom domain off→on via API (re-PUT of the same value does NOT re-queue). Pre-cutover
DNS for rollback is in ADR 004. Local resolver may still cache old Vercel IPs; public
DNS is on GitHub.

Blockers: none.

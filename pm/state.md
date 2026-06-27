# vz-static-site — State

Updated: 2026-06-27

## Roadmap

Active (children + detail in bd; run `bd show <id>`):
1. `vz-site` — Nuovo sito statico pubblico. Static public rebuild done; production
   cutover complete (vz-site.9 closed). Open: `vz-site.17` redirect legacy
   `vzaccaria.github.io` account site to www (P3, not started).
2. `vz-site-csn` (P3) — Updates sito: pagina laboratorio. Merge research + theses
   into a "Lab & theses" virtual lab page. Open: not started.

Parked: alternative SSG frameworks (revisit only on a concrete Astro blocker).

## Handoff

Written: 2026-06-27 20:05 CEST · Claude

Done: `vz-site.9` production cutover **complete and verified**. Pushed root build
to main (Pages deploy), set Pages custom domain `www.vittoriozaccaria.net` via API
(workflow deploys need the repo setting, not just the artifact CNAME file). At
Namecheap: nameservers switched Vercel→BasicDNS, apex A → 4 GitHub IPs, `www` CNAME
→ vzaccaria.github.io. TLS cert issued (Let's Encrypt) after a domain off/on toggle
unstuck GitHub's issuance queue (~2h passive wait failed; `is_https_eligible` was
true throughout). Enforce HTTPS on. Verified @ GitHub IP: www 200, apex 301→www,
all routes 200, valid cert, new datasheet content. ADR 004 records final DNS,
rollback, verification.

State: production live on GitHub Pages at https://www.vittoriozaccaria.net.

Next: 1) `vz-site.17` — redirect the legacy `vzaccaria.github.io` account repo
(branch master, old 2022 site) to www. 2) Optional hygiene: remove `www` from the
old Vercel project (DNS no longer routes to it; keep the project parked for the
rollback grace window per ADR 004 — do not delete yet).

Gotchas: cert was stuck ~2h despite correct config; the fix was toggling the Pages
custom domain off→on via API (re-PUT of the same value does NOT re-queue). Pre-cutover
DNS for rollback is in ADR 004. Local resolver may still cache old Vercel IPs; public
DNS is on GitHub.

Blockers: none.

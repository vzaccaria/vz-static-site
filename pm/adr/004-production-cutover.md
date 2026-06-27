# ADR 004: Production cutover to GitHub Pages

Date: 2026-06-27

Status: Accepted

## Context

`vz-site.9` performs the final switch of `www.vittoriozaccaria.net` from the old
Next.js site hosted on Vercel to the static `vz-static-site` build on GitHub
Pages. ADR 001 assumed Dynadot as registrar/DNS manager; the verified reality is:

- Registrar: **Namecheap** (staying).
- Authoritative nameservers before cutover: **`ns1.vercel-dns.com`,
  `ns2.vercel-dns.com`** (Vercel DNS).
- `www.vittoriozaccaria.net` → HTTP 200, `server: Vercel` (old Next site).
- `vittoriozaccaria.net` (apex) → 308 → `www`, served by Vercel.
- `vzaccaria/vz-static-site` GitHub Pages: `build_type=workflow`, `cname=null`,
  `https_enforced=true`, serving `https://vzaccaria.github.io/vz-static-site/`.
- `www` custom domain is unattached on every `vzaccaria` Pages repo → no GitHub
  side conflict.

## Decision

Serve production from GitHub Pages (`vz-static-site`) at the canonical
`https://www.vittoriozaccaria.net`, apex redirecting to `www`. Manage DNS at
**Namecheap BasicDNS** after switching nameservers away from Vercel, fully
removing Vercel from both hosting and DNS. Keep the old Next deployment parked
(not deleted) during the rollback grace window.

### Repo changes (committed for this cutover)

- `public/CNAME` = `www.vittoriozaccaria.net` (Astro copies to `dist/`; Pages
  applies the custom domain on deploy).
- `.github/workflows/pages.yml`: build env `SITE_URL=https://www.vittoriozaccaria.net`,
  `SITE_BASE` removed (root base `/`).
- `astro.config.mjs` default `site` and `src/data/site.ts` fallback set to
  `https://www.vittoriozaccaria.net` (the preview phase is over).

### Cutover sequence

Ordered to avoid user-facing downtime (Vercel serves `www` until DNS flips):

1. Push the repo changes to `main` → Pages deploys the root build and claims the
   `www` custom domain. This is the cutover trigger. The
   `vzaccaria.github.io/vz-static-site/` preview URL stops serving (redirects to
   `www`, still on Vercel) — expected.
2. At Namecheap: switch nameservers from Vercel to **Namecheap BasicDNS**, then
   create the production records (see below). Re-create any preserved MX/TXT.
3. Wait for nameserver delegation + record propagation; GitHub issues the `www`
   HTTPS certificate once DNS resolves to Pages. Enable **Enforce HTTPS**.
4. Remove `www.vittoriozaccaria.net` from the Vercel project; **park** (do not
   delete) the old Next deployment for the rollback window.

## Final DNS (Namecheap BasicDNS)

```text
@    A      185.199.108.153
@    A      185.199.109.153
@    A      185.199.110.153
@    A      185.199.111.153
www  CNAME  vzaccaria.github.io
```

Optional IPv6 for apex:

```text
@    AAAA   2606:50c0:8000::153
@    AAAA   2606:50c0:8001::153
@    AAAA   2606:50c0:8002::153
@    AAAA   2606:50c0:8003::153
```

Preserve any existing non-web records (MX/TXT) when recreating the zone. None
were observed on the current Vercel-hosted zone — confirm in the Vercel DNS
dashboard before switching nameservers.

## Rollback

Pre-cutover state captured 2026-06-27 for restore:

- Nameservers: `ns1.vercel-dns.com`, `ns2.vercel-dns.com`
- `www` A: `76.76.21.22`, `66.33.60.66`
- apex A: `76.76.21.241`, `76.76.21.61`

Rollback procedure:

1. Restore the Vercel nameservers at Namecheap (the old Next site, kept parked,
   becomes reachable again once delegation reverts).
2. Re-attach `www.vittoriozaccaria.net` to the Vercel project if it was removed.
3. In the repo, revert the cutover commit (restores the project-preview build)
   and remove `public/CNAME`.

The old Vercel Next site MUST remain parked (not deleted) until production on
GitHub Pages is verified stable.

## Verification (production verificata)

- `curl -I https://www.vittoriozaccaria.net/` → `server: GitHub.com`.
- `curl -I https://vittoriozaccaria.net/` → 301/308 → `https://www.vittoriozaccaria.net/`.
- Valid HTTPS certificate on `www`; Enforce HTTPS enabled.
- `dig +short vittoriozaccaria.net A` → the four `185.199.108-111.153` IPs.
- `dig +short www.vittoriozaccaria.net CNAME` → `vzaccaria.github.io.`.
- Spot-check: `/`, `/bio/`, `/research/`, `/courses/`, `/theses/`, `/blog/`, a
  blog post, `/feed.xml`, `/sitemap.xml`.

## Consequences

- Production no longer requires Vercel or a Node runtime; the site is fully
  static on GitHub Pages.
- DNS is owned at Namecheap; Vercel is removed from the DNS path after cutover.
- The temporary `vzaccaria.github.io/vz-static-site/` preview URL is retired by
  the custom-domain claim.
- ADR 001's Dynadot assumption is superseded for DNS management by this ADR.

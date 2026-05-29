# ADR 002: GitHub Pages project preview routing

Date: 2026-05-29

Status: Accepted

## Context

`vz-site12` added a temporary GitHub Pages project deploy so the Astro scaffold
can be tested before the later custom preview domain work. The intended test URL
is:

```text
https://vzaccaria.github.io/vz-static-site/
```

The first deployment succeeded, but requests to that URL redirected to:

```text
https://www.vittoriozaccaria.net/vz-static-site/
```

That happened because the user Pages repository, `vzaccaria.github.io`, still
had `www.vittoriozaccaria.net` configured as its GitHub Pages custom domain.
The current production `www.vittoriozaccaria.net` site is served by Vercel, not
by this new repository.

## Decision

Remove the `www.vittoriozaccaria.net` custom domain from the
`vzaccaria.github.io` GitHub Pages repository so project Pages can be tested
directly under `vzaccaria.github.io`.

Keep `www.vittoriozaccaria.net` unchanged at the DNS/hosting layer. It must
continue to serve the current production site until the planned production
cutover.

For the temporary `vz-static-site` project preview, keep building with:

```bash
SITE_URL=https://vzaccaria.github.io SITE_BASE=/vz-static-site npm run build
```

The later custom-domain preview remains a separate deployment step and should
use `preview.vittoriozaccaria.net` without `SITE_BASE`.

## Consequences

- `vzaccaria.github.io/vz-static-site/` can be used as an early project preview
  URL once GitHub's Pages redirect cache expires.
- `www.vittoriozaccaria.net` remains owned operationally by the current Vercel
  deployment until cutover.
- The new static site must not assume that account-level GitHub Pages owns the
  production domain.
- Future production cutover must explicitly move DNS/custom-domain ownership
  from the current production host to the selected static host.

## Verification

- GitHub Pages API for `vzaccaria.github.io` reports `cname: null` after the
  change.
- `https://www.vittoriozaccaria.net/` continues to return HTTP 200 from Vercel
  after the GitHub Pages custom-domain removal.
- `https://vzaccaria.github.io/vz-static-site/` returns HTTP 200 from GitHub
  Pages after the edge redirect cache expires.

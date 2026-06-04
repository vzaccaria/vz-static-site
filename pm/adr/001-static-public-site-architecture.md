# ADR 001: Static public site architecture

Date: 2026-05-29

Status: Accepted

## Context

`vz-static-site` is the public repository for the rebuilt personal academic
website. The previous website lives in a private Next.js codebase and has access
to private source data. The new repository must be safe to publish, simple to
build locally, and deployable as static files without a runtime application
server.

`vz-site.0` requires an initial decision for repository boundaries, static-site
generator, preview and production environments, and expected DNS under Dynadot.

## Decision

Use a separate public repository, `vz-static-site`, as the only source for the
public static website. Keep all private source data outside this repository and
import only allowlisted public data through the pipeline owned by `vz-site.2`.

Use Astro in its default static/pre-rendered mode as the site generator. Astro is
the accepted default for `vz-site.1` unless scaffold work finds a concrete
blocker. Use npm and a committed lockfile for reproducible local and CI builds.

Deploy with GitHub Actions to GitHub Pages. During preview, publish the Pages
site at `https://preview.vittoriozaccaria.net`. At production cutover, switch the
same Pages site to the canonical domain `https://www.vittoriozaccaria.net`.
The apex domain `https://vittoriozaccaria.net` should redirect to `www` after
GitHub Pages is configured with the apex records.

Dynadot is the registrar and DNS manager. DNS changes must be explicit and phase
specific; do not use wildcard DNS records.

## Environment contract

### Local

- Source lives in this public repository.
- Private data sources remain outside the repository.
- The build consumes committed public fixtures and, after `vz-site.2`, generated
  public data only.
- Expected commands after `vz-site.1`: `npm install`, `npm run dev`,
  `npm run build`, `npm run preview`, and `npm run check`.
- No secrets are required for a normal static build. Public browser variables,
  if any, must use explicit `PUBLIC_` naming and must not contain credentials.

### Preview

- URL: `https://preview.vittoriozaccaria.net`.
- Purpose: review the new static site before production DNS cutover.
- Astro config should use `site: "https://preview.vittoriozaccaria.net"` and no
  `base` while the custom preview domain is active.
- GitHub Pages custom domain should be set to `preview.vittoriozaccaria.net`.
- Dynadot expected record:

```text
preview  CNAME  vzaccaria.github.io
```

### Production

- Canonical URL: `https://www.vittoriozaccaria.net`.
- Apex URL: `https://vittoriozaccaria.net`, redirected by GitHub Pages once apex
  and `www` records are configured.
- Astro config should use `site: "https://www.vittoriozaccaria.net"` and no
  `base`.
- GitHub Pages custom domain should be changed from preview to
  `www.vittoriozaccaria.net`.
- Dynadot expected records:

```text
@    A      185.199.108.153
@    A      185.199.109.153
@    A      185.199.110.153
@    A      185.199.111.153
www  CNAME  vzaccaria.github.io
```

Optional IPv6 records, if enabled:

```text
@    AAAA   2606:50c0:8000::153
@    AAAA   2606:50c0:8001::153
@    AAAA   2606:50c0:8002::153
@    AAAA   2606:50c0:8003::153
```

Existing non-web DNS records, such as email-related `MX` or `TXT` records, must
not be removed during cutover unless there is a specific reason.

## Consequences

- The site can be hosted as static assets and does not require a Node runtime in
  production.
- Preview and production are separate phases for the same GitHub Pages site. If
  long-lived simultaneous preview and production custom domains become necessary,
  create a follow-up decision for a second Pages site or a different static host.
- `vz-site.1` should scaffold Astro with static output, npm, and GitHub Pages as
  the target deploy environment.
- `vz-site.2` must preserve the public/private boundary and must not copy private
  source data wholesale into this repository.

## Alternatives considered

- Continue with Next.js: rejected for the public rebuild because it preserves
  more runtime and private-data coupling than needed for a static academic site.
- Eleventy or Hugo: viable static-site generators, but Astro gives a stronger
  path for content collections, MDX, and limited interactive islands while still
  producing static output by default.
- A separate preview host immediately: deferred. GitHub Pages is sufficient for
  the first preview phase. Revisit only if parallel preview and production
  custom domains are required after cutover.

## References

- Astro static/on-demand rendering docs:
  https://docs.astro.build/en/guides/on-demand-rendering/
- Astro GitHub Pages deploy docs:
  https://docs.astro.build/en/guides/deploy/github/
- GitHub Pages custom domain docs:
  https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- Dynadot CNAME docs:
  https://www.dynadot.com/help/question/create-CNAME

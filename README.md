# vz-static-site

Public static website for Vittorio Zaccaria.

## Commands

```bash
npm install
npm run dev
npm run content:check
npm run check
npm run build
npm run preview
```

Use Node.js 22.12 or newer.

`npm run dev` starts the local Astro development server. `npm run build`
produces static files in `dist/`; no runtime server is required for deployment.
The build also syncs public blog image assets from `data/imported/blog/images/`
to the generated static asset tree used by rendered Markdown posts.

## Environment

The default build target is the preview domain:
`https://preview.vittoriozaccaria.net`.

Set `SITE_URL` during CI or deployment to change the canonical site URL:

```bash
SITE_URL=https://www.vittoriozaccaria.net npm run build
```

`SITE_URL` controls canonical URLs, OpenGraph URLs, `feed.xml`, and
`sitemap.xml`. `SITE_BASE` controls subpath deployments and static asset paths.

For the temporary GitHub Pages project URL, the deployment workflow builds with:

```bash
SITE_URL=https://vzaccaria.github.io SITE_BASE=/vz-static-site npm run build
```

After a push to `main`, the `Deploy GitHub Pages` workflow publishes the test
site at:

```text
https://vzaccaria.github.io/vz-static-site/
```

Private source data must stay outside this repository. Only the sanitized public
export under `data/imported/` should be committed here.

## Public Data

The private repo `../vz-personal-store` exports sanitized public data into
`data/imported/`. Validate the imported tree:

```bash
npm run data:check
```

After running the private exporter, use strict validation:

```bash
npm run data:check:strict
npm run content:check
```

The canonical export allowlist lives in
`../vz-personal-store/pm/website/export-allowlist.yaml`. This repository should
not maintain a second sanitizer.

`npm run check` requires `data/imported/` and validates the public content model
defined in `src/data/content-model.ts`.

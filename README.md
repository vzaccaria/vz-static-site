# vz-static-site

Public static website for Vittorio Zaccaria.

## Commands

```bash
npm install
npm run dev
npm run check
npm run build
npm run preview
```

Use Node.js 22.12 or newer.

`npm run dev` starts the local Astro development server. `npm run build`
produces static files in `dist/`; no runtime server is required for deployment.

## Environment

The default build target is the preview domain:
`https://preview.vittoriozaccaria.net`.

Set `SITE_URL` during CI or deployment to change the canonical site URL:

```bash
SITE_URL=https://www.vittoriozaccaria.net npm run build
```

For the temporary GitHub Pages project URL, the deployment workflow builds with:

```bash
SITE_URL=https://vzaccaria.github.io SITE_BASE=/vz-static-site npm run build
```

After a push to `main`, the `Deploy GitHub Pages` workflow publishes the test
site at:

```text
https://vzaccaria.github.io/vz-static-site/
```

Private source data must stay outside this repository. Only public,
allowlisted generated data should be committed here.

## Public Data

Validate the committed public data:

```bash
npm run data:check
```

Regenerate it from a private export outside this repository:

```bash
npm run data:sync -- --source /absolute/path/to/private-export.json
```

The allowlist lives in `data/public-data.allowlist.json`; the generated public
artifact lives in `src/data/generated/public-data.json`.

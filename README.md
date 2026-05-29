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

Private source data must stay outside this repository. Only public,
allowlisted generated data should be committed here.

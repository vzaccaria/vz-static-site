# Public Data Pipeline

The private repository `../vz-personal-store` owns sanitization. This public
repository consumes the sanitized export tree and validates that it is usable by
the static site.

## Upstream Export

Run this from the root of `../vz-personal-store`:

```bash
bun run website/scripts/export-public/index.ts \
  --manifest pm/website/export-allowlist.yaml
```

The private manifest is the canonical allowlist. It writes the sanitized output
to this repository under:

```text
data/imported/
```

Treat `data/imported/` as generated read-only data in this repository. Do not
edit files there by hand.

## Expected Imported Tree

The current export contract is documented in
`../vz-personal-store/pm/website/handoff-vz-static-site.md` and includes:

```text
data/imported/
├── assets/Logo.{svg,png,pdf}
├── authors/
├── blog/
├── biblio.bib
├── bibliov2.json
├── cv-jr.yaml
├── group.md
├── projectsData.js
├── theses.json
└── thesis-short.md
```

`cv-jr.json` is intentionally not exported. The public site should derive any
JSON representation from `cv-jr.yaml` in the content-model/build layer.

## Public Repo Validation

Validate whatever sanitized export is currently present:

```bash
npm run data:check
```

For CI before the first real export, `npm run data:check` passes with a warning
if `data/imported/` is absent. After running the private export, use strict mode:

```bash
npm run data:check:strict
```

The validator checks:

- expected files/directories are present,
- expected files are not empty,
- JSON files parse.

## Responsibility Split

- Private repo: choose source files, apply allowlist, strip/redact private data,
  and write `data/imported/`.
- Public repo: validate the imported tree, derive content models, render static
  pages, and deploy.
- Cross-repo beads are referenced in notes only; do not create Beads
  dependencies across repositories.

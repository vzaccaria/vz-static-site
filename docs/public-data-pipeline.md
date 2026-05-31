# Public Data Pipeline

The public site must never copy private source data directly into this
repository. `vz-site2` defines a narrow export contract:

1. A private repository produces a JSON export outside this repository.
2. `data/public-data.allowlist.json` lists every field that may become public.
3. `scripts/sync-public-data.mjs` copies only those fields.
4. `npm run data:check` validates the committed public output.

## Commands

Validate the public data currently committed in this repository:

```bash
npm run data:check
```

Run the pipeline against the safe example fixture:

```bash
npm run data:sync:example
```

Run the pipeline against a real private export:

```bash
npm run data:sync -- --source /absolute/path/to/private-export.json
```

Use `--dry-run` to inspect the sanitized JSON without writing it:

```bash
npm run data:sync -- --source /absolute/path/to/private-export.json --dry-run
```

## Safety Rules

- Keep real private exports outside this repository.
- If a temporary local copy is needed, put it under `data/private/` or
  `data/imports/`; both paths are ignored by Git.
- Add new public fields only by editing `data/public-data.allowlist.json`.
- Do not commit raw private exports, screenshots, logs, or database dumps.
- Treat `src/data/generated/public-data.json` as the only public generated data
  artifact from this pipeline.

## Output

The generated file is:

```text
src/data/generated/public-data.json
```

The validator rejects:

- fields not present in the allowlist,
- required public fields that are missing,
- blocked key names such as `private`, `secret`, `token`, `password`,
  `credential`, `internal`, `confidential`, or `notes`,
- common secret-looking string values.

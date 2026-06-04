# ADR 003: Imported public data contract

Date: 2026-06-01

Status: Accepted

## Context

`../vz-personal-store/pm/website/handoff-vz-static-site.md` defines the bridge
from the private repository to this public static-site repository. The private
repo already owns the canonical allowlist and sanitization script:

```text
pm/website/export-allowlist.yaml
website/scripts/export-public/
```

That script writes sanitized files into this repository under `data/imported/`.
The initial `vz-site.2` implementation added a second allowlist and sanitizer in
the public repo. That duplicated the private manifest and risked divergence.

## Decision

Do not re-sanitize exported data in `vz-static-site`.

The public repo consumes `data/imported/` as a generated read-only tree produced
by the private exporter. The public repo validates the tree shape and basic
parseability through:

```bash
npm run data:check
npm run data:check:strict
```

The validator checks for expected files, parseable JSON, non-empty required
files, and expected directories. It does not inspect or redact private fields;
sanitization remains entirely upstream.

## Consequences

- The canonical public/private allowlist stays in the private repo.
- `vz-static-site` does not maintain a duplicate field allowlist.
- `data/imported/` becomes the handoff boundary between repositories.
- `vz-site.3` should build content models from `data/imported/`, including
  deriving any JSON representation of `cv-jr.yaml` locally.
- CI can run before an export exists; strict validation should be used after
  running the private exporter.

## Rejected Alternatives

- A second public allowlist and sanitizer: rejected as redundant and prone to
  drift from the private export manifest.
- Trusting the imported tree completely: rejected because the public repo still
  benefits from shape and parseability checks before content-model work runs.

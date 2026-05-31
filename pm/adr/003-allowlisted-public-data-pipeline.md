# ADR 003: Allowlisted public data pipeline

Date: 2026-05-31

Status: Accepted

## Context

The rebuilt static site lives in a public repository, while the legacy/private
sources may contain private email addresses, notes, drafts, tokens, student
information, or other non-public fields. `vz-site2` needs a repeatable import
path without making this repository depend on private source data.

## Decision

Use an allowlist-first JSON pipeline:

- private exports stay outside this repository,
- `data/public-data.allowlist.json` is the only list of fields allowed to become
  public,
- `scripts/sync-public-data.mjs` copies only allowlisted fields,
- `src/data/generated/public-data.json` is the committed public output,
- `npm run data:check` validates the output in CI via `npm run check`.

The sync command refuses to run without an explicit `--source` path. This keeps
the default behavior from copying any private export into the repository.

## Consequences

- Adding a new public field requires a deliberate allowlist edit.
- Manual edits to generated public data are detected if they add non-allowlisted
  fields or blocked key names.
- The pipeline can be tested without private data through
  `npm run data:sync:example`.
- `vz-site3` can build the content model on top of the generated public JSON
  contract.

## Rejected Alternatives

- Copying JSON exports wholesale and hiding fields in rendering code: rejected
  because private fields would still be committed.
- Trusting naming conventions only: rejected because validation should enforce
  the public/private boundary.
- Keeping generated data outside Git entirely: deferred. The static site should
  be buildable from the public repository without access to private sources.

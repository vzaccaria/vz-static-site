# Publication venues (`/tools/pubvenues/`)

`data/pubvenues/venues.json` lists conferences and workshops with their
submission deadlines. It is maintained by hand (or by an agent skill) directly in
this repository; it is not part of the `vz-personal-store` export.

The schema lives in `data/pubvenues/schema/pubvenues-v1.schema.json`.
`npm run venues:check` (part of `npm run check`) validates it and these
invariants:

- category ids and venue keys are unique, and every `venue.category` exists;
- at most one edition per `year` per venue; `end` needs `start`, `end ≥ start`;
- within an edition, a track appears twice only with distinct `round` labels;
- `abstract ≤ deadline ≤ notification`, and no deadline after the conference start;
- `timezone` is `AoE`, `UTC`, `UTC±HH:MM` or an IANA zone.

## Model

```text
document  schema_version, updated, categories[{id,label}], venues[]
venue     key, acronym, name, kind, category, tags[], publisher?, url?,
          proceedings?, dblp?, rankings[], tracked, editions[], note?
ranking   source, value, year?, url?, note?
edition   year, name?, url?, program?, location?, start?, end?,
          submissions[], checked?, source?, note?
submission track, round?, abstract?, deadline, notification?, timezone?,
          estimated?, url?, note?
```

- `key` is stable across years; agents use it to find the venue to update.
- `rankings` is free-form. The page reads `source: "CORE"` (value `A*`, `A`,
  `B`, `C`, anything else counts as "Other") and `source: "h5"` (numeric).
- Multiple deadlines per year are one `submissions[]` entry per round
  (`round: "Spring"`, `"Cycle 2"`, `"Issue 3"`…), each with its notification.
- `track` is `papers`, `posters`, `artifacts` or `workshops`. Deadline colour
  and sorting use only `papers` unless the page's "Tracks" selector says "All".
- Dates are `YYYY-MM-DD` and close at the end of that day in the submission's
  `timezone` (default AoE).
- `estimated: true` marks a date projected from the previous edition; replace it
  and drop the flag once the CFP is published.
- `checked`/`source` record when and where an edition was last verified.
- `tracked: false` keeps a venue in the archive list without a table row.

## Updating

The project skill `.omp/skills/pubvenues-refresh/SKILL.md` describes the full
refresh procedure for agents. The tooling it relies on:

- `npm run venues:stale -- [--days N] [--json]` lists tracked venues with no
  open paper deadline, open deadlines that are still `estimated`, or editions
  last `checked` more than N (default 60) days ago.
- `npm run venues:merge -- [--dry-run] <patch.json>...` applies patches: a JSON
  array of objects with a `key`. Unknown keys add a complete venue; known keys
  overwrite the given venue fields, and `editions` are upserted by `year` (a
  patched edition replaces that year's edition entirely; other years are kept).
  The merged document is validated before writing and `updated` is set to today.

Add next-year editions instead of overwriting past ones, then run
`npm run venues:check`.

## Page behaviour

Each tracked venue gets one row. The shown edition is the one with the earliest
open deadline; failing that, the earliest edition whose conference has not ended;
failing that, the most recent edition. Rows are coloured by the next deadline
(> 60 days, ≤ 60, ≤ 30, past) or, optionally, by the conference date. Filters,
grouping, sorting and colouring are stored in the query string, so a view can be
bookmarked.

The table is rendered at build time and re-rendered in the browser with the
current time, so colours stay correct between deploys.

Initial data (2026-10-22) comes from the Shinagawa Laboratory list
(<https://www.os.is.s.u-tokyo.ac.jp/en/conf/>, revision 2026-07-28), plus
cryptography, real-time/embedded and design-automation venues researched on the
official sites.

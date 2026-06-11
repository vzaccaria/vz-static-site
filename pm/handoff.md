# Session Handoff

Written: 2026-06-11 12:25 CEST
Author: Claude

## What was done this session

- Closed `vz-ds.5` — Datasheet voice (mono labels uppercase + §N section
  markers) plus the user-requested extensions:
  - Heading scale downsized (`h1` was `clamp(3.25rem, 10vw, 8rem)` → now
    `clamp(1.9rem, 3.2vw, 2.6rem)`; `.page-hero h1` from up to 6.4rem → 2.3rem
    max; `h2/h3/h4` and `.lede` reduced in proportion; mobile `h1` cap from
    4.6rem → 2.2rem).
  - Profile photo capped (`.profile-figure { max-width: 200px }`, hero grid
    right column shrunk from `minmax(260px, 380px)` to `200px`; bio
    `.page-hero--split` second column set to `240px`).
- Added `.section-marker` class (mono, accent) and inserted `§N` markers
  inline before `h1`/`h2` on index, research, bio, theses, courses, blog,
  tags index pages. Marker is `aria-hidden` so screen readers skip the
  ordinal noise.
- Promoted `.eyebrow`, `.section-kicker`, `.meta` (+ new `.label--mono`
  utility) to mono uppercase tracked labels using
  `--ds-fonts-mono` and `--ds-tracking-label` (0.1em).
- Extended same mono-label treatment to `.metric-strip span` and
  `.profile-figure figcaption span`.
- Voice check: no emoji or exclamation marks in UI text (page templates
  scanned).
- `npm run check` and `npm run build` green. Visual smoke-tested home,
  research, bio via dev server + Playwright; layout matches datasheet
  direction (small headings, square photo, blue §N markers).

## Current state

- Epic `vz-ds` (design-system adoption) is now complete (.1 → .5 all closed).
- Two `console.error` 404s on `/fonts/IBMPlex*.otf` remain — pre-existing,
  unchanged by this session, out of scope.

## In progress

- None.

## Blockers & open questions

- Section-marker numbering is page-local (`§1`, `§2`, …) not hierarchical
  (`§1.1`, `§1.2`). Bead description suggested the dotted form but the page
  IA is shallow enough that flat numbering reads cleaner. Revisit if a deeper
  hierarchy emerges.

## Recommended next steps

1. Start `vz-site.7` — Preview deploy (still parked at top of plan).
2. Optional follow-up: fix the pre-existing `/fonts/IBMPlex*.otf` 404s in
   `src/styles/ds/fonts.css` (paths bypass `withBasePath`).

## Context the next agent should know

- Mono label utility: apply `class="label--mono"` (or use `.eyebrow`,
  `.section-kicker`, `.meta`) for any new mono uppercase tracked datasheet
  label.
- Section marker pattern: `<h2><span class="section-marker"
  aria-hidden="true">§N</span>Title</h2>`.
- Hero grids now have fixed-width right columns (`.hero` 200px,
  `.page-hero--split` 240px). When adding new hero variants, follow the same
  pattern — do not return to oversized `minmax(260px, 380px)`-style columns.
- DS token usage reminder: `--ds-tracking-label` is the 0.1em "wide" tracking
  the bead text called "tracking-wide ≈ 0.1em"; the actual `--ds-tracking-wide`
  token is 0.04em.

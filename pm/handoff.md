# Session Handoff

Written: 2026-06-11 11:05 CEST
Author: Claude

## What was done this session

- Closed `vz-ds.4` — Shape conventions (zero radii, zero shadows, ink borders).
- `src/styles/global.css`:
  - Removed legacy `--shadow` custom var from `:root` and its single use on
    `.profile-figure, .contact-panel`.
  - Replaced `.tag-pill__count` `border-radius: 50%` with
    `var(--ds-radius-flat)` (0px). No avatar-circle CSS exists, so no ADR
    exception was needed.
  - Replaced every literal `1px solid` with
    `var(--ds-border_width-bw1) solid` (≈1.33px). Replaced both `3px solid`
    accent left-rules with `var(--ds-border_width-bw3) solid` (4px) and the
    one `4px solid` accent top-rule with the same token.
- Verified `npm run check` and `npm run build` green. Dev server smoke-checked
  on `:4321/` — pre-existing DS font 404s observed (unchanged from prior
  session, out of scope).

## Current state

- `vz-ds.4` closed. `vz-ds.5` now ready (datasheet voice).
- Token-name mapping note: DS exposes `--ds-radius-flat`, `--ds-shadow-flat`,
  `--ds-border_width-bw1/bw2/bw3`. Earlier bead text referenced
  `*-none/thin/med/heavy`; those names do not exist in
  `src/styles/ds/tokens.css`. Future fases must use the actual `bw*`/`flat`
  names.

## In progress

- None.

## Blockers & open questions

- None.

## Recommended next steps

1. Start `vz-ds.5` — datasheet voice: mono uppercase labels, `§N.N` section
   markers in section headers.
2. Eventually revisit pre-existing DS font 404s under `src/styles/ds/fonts.css`
   (Vite warnings, dev console 404s on `/fonts/IBMPlex*.otf`).

## Context the next agent should know

- DS shape tokens in use: `--ds-radius-flat` (0), `--ds-border_width-bw1`
  (1.33px), `--ds-border_width-bw3` (4px). `bw2` (2.67px) not yet used in
  `global.css` — adopt when a mid-weight rule is needed.
- No `box-shadow` declarations remain in site CSS (DS tokens.css unchanged).
- Avatar image (`.profile-figure img`) has no border-radius — stays square,
  consistent with datasheet direction.

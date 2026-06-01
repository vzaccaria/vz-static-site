# Project Instructions for AI Agents

This file provides instructions and context for AI coding agents working on this project.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->


## Build & Test

```bash
npm install
npm run dev
npm run data:check
npm run data:check:strict
npm run check
npm run build
npm run preview
```

Use Node.js 22.12 or newer. The npm scripts disable Astro telemetry so agent
runs do not write outside the repository.

## Architecture Overview

This is an Astro static site. Source pages live under `src/pages`, shared page
chrome under `src/layouts`, CSS under `src/styles`, public data helpers under
`src/data`, and future content collections under `src/content`.

Production output is static files in `dist/`; no runtime server is required.
Private source data must stay outside this public repository and enter only via
the sanitized export produced by `../vz-personal-store`.

The public data handoff is documented in `docs/public-data-pipeline.md`.
The private repo `../vz-personal-store` owns sanitization and exports generated
data to `data/imported/`; this repo validates and consumes that tree.

## Conventions & Patterns

- Track work with beads (`bd`) and keep PM context in `pm/`.
- Use npm and commit `package-lock.json`.
- Keep canonical site URL configurable through `SITE_URL`; preview defaults to
  `https://preview.vittoriozaccaria.net`.
- Preserve unrelated DNS and private-data boundaries documented in ADR 001.
- Do not create a second public sanitizer unless ADR 003 is superseded.
- Treat `data/imported/` as generated read-only data from the private exporter.

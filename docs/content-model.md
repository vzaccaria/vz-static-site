# Content Model

`vz-site3` defines the public content model for the imported static data tree.
The schemas live in `src/data/content-model.ts` and are enforced by:

```bash
npm run content:check
npm run check
```

`npm run check` also runs `data:check:strict`, so `data/imported/` must be
present before CI or local validation.

## Imported Sources

The model currently validates:

- `data/imported/cv-jr.yaml` as the public CV, including teaching courses,
  research records, work history, education, languages, and profile basics.
- `data/imported/bibliov2.json` as publications.
- `data/imported/theses.json` as thesis topics.
- `data/imported/projectsData.js` as project cards.
- `data/imported/blog/*.md` as blog posts.
- `data/imported/authors/*.md` as author profiles.
- `data/imported/group.md` and `data/imported/thesis-short.md` as required
  markdown bodies.

## Validation Rules

Object schemas are strict. A build fails when a validated object contains an
unknown key, when a required key is missing, or when a value has the wrong type.

Blog posts and authors are also registered as Astro content collections from
`data/imported/blog` and `data/imported/authors`, so Astro validates them during
`astro check` and `astro build`.

Blog author references are checked against author file names. For example,
`authors: ["default"]` requires `data/imported/authors/default.md`.

## Boundaries

This repository does not sanitize private data. It validates the already
sanitized export produced by `../vz-personal-store`. If the export shape changes,
update the private export contract first, then update these public schemas.

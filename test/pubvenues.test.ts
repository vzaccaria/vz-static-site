import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  createPubVenuesValidator,
  loadPubVenues,
  mergePubVenues,
  PubVenuesValidationError,
  venuesNeedingRefresh
} from "../src/data/pubvenues";
import {
  buildRows,
  deadlineInstant,
  defaultViewState,
  filterRows,
  groupRows,
  sortRows,
  type PubVenue,
  type PubVenuesDocument
} from "../src/data/pubvenues-model";

const root = path.join(process.cwd(), "data/pubvenues");

const venue = (overrides: Partial<PubVenue>): PubVenue => ({
  key: "demo",
  acronym: "DEMO",
  name: "Demo Conference",
  kind: "conference",
  category: "os",
  tags: [],
  rankings: [],
  tracked: true,
  editions: [],
  ...overrides
});

const documentWith = (venues: PubVenue[]): PubVenuesDocument => ({
  schema_version: 1,
  updated: "2026-10-22",
  categories: [{ id: "os", label: "Operating Systems" }],
  venues
});

test("deadlines close at the end of the day in their timezone", () => {
  assert.equal(
    new Date(deadlineInstant("2026-11-17")).toISOString(),
    "2026-11-18T11:59:59.999Z"
  );
  assert.equal(
    new Date(deadlineInstant("2026-07-01", "America/Los_Angeles")).toISOString(),
    "2026-07-02T06:59:59.999Z"
  );
  assert.equal(
    new Date(deadlineInstant("2026-12-01", "America/Los_Angeles")).toISOString(),
    "2026-12-02T07:59:59.999Z"
  );
  assert.equal(
    new Date(deadlineInstant("2026-11-17", "UTC+01:00")).toISOString(),
    "2026-11-17T22:59:59.999Z"
  );
  assert.throws(() => deadlineInstant("2026-11-17", "Mars/Olympus"));
});

test("rows follow the next open round across editions", () => {
  const demo = venue({
    editions: [
      {
        year: 2026,
        start: "2026-12-10",
        end: "2026-12-12",
        submissions: [{ track: "papers", deadline: "2026-05-01" }]
      },
      {
        year: 2027,
        start: "2027-12-10",
        end: "2027-12-12",
        submissions: [
          { track: "papers", round: "Fall", deadline: "2027-01-15" },
          { track: "papers", round: "Spring", deadline: "2026-11-01" },
          { track: "posters", deadline: "2026-10-25" }
        ]
      }
    ]
  });
  const document = documentWith([demo]);

  const betweenRounds = Date.parse("2026-11-10T00:00:00Z");
  const [row] = buildRows(document, betweenRounds, "papers");
  assert.equal(row.edition?.year, 2027);
  assert.equal(row.next?.round, "Fall");
  assert.equal(row.last?.round, "Spring");

  const [withPosters] = buildRows(document, Date.parse("2026-10-23T00:00:00Z"), "all");
  assert.equal(withPosters.next?.track, "posters");

  // [[NOME_BH6QB3]] AoE deadline is still open at 11:00Z on the following day.
  const lastHour = Date.parse("2027-01-16T11:00:00Z");
  assert.equal(buildRows(document, lastHour, "papers")[0].next?.round, "Fall");

  const allClosed = Date.parse("2027-02-01T00:00:00Z");
  const [closed] = buildRows(document, allClosed, "papers");
  assert.equal(closed.next, undefined);
  assert.equal(closed.edition?.year, 2027);
});

test("an edition whose conference is still ahead wins over newer closed ones", () => {
  const demo = venue({
    editions: [
      { year: 2026, start: "2026-12-10", submissions: [{ track: "papers", deadline: "2026-05-01" }] },
      { year: 2027, submissions: [{ track: "papers", deadline: "2026-09-01", estimated: true }] }
    ]
  });
  const [row] = buildRows(documentWith([demo]), Date.parse("2026-10-22T00:00:00Z"), "papers");
  assert.equal(row.edition?.year, 2026);
});

test("rows without an upcoming deadline sink in both sort directions", () => {
  const open = venue({
    key: "open",
    acronym: "ZOPEN",
    editions: [{ year: 2027, submissions: [{ track: "papers", deadline: "2027-01-01" }] }]
  });
  const closed = venue({
    key: "closed",
    acronym: "ACLOSED",
    editions: [{ year: 2026, submissions: [{ track: "papers", deadline: "2026-01-01" }] }]
  });
  const rows = buildRows(documentWith([closed, open]), Date.parse("2026-10-22T00:00:00Z"), "papers");
  assert.deepEqual(sortRows(rows, "deadline", "asc").map((row) => row.venue.key), ["open", "closed"]);
  assert.deepEqual(sortRows(rows, "deadline", "desc").map((row) => row.venue.key), ["open", "closed"]);
});

test("committed venues validate and broken invariants are reported", async () => {
  const document = await loadPubVenues(root);
  assert.ok(document.venues.some((entry) => entry.tracked));

  const schema = JSON.parse(
    await readFile(path.join(root, "schema/pubvenues-v1.schema.json"), "utf8")
  );
  const validate = createPubVenuesValidator(schema);
  const broken = documentWith([
    venue({
      category: "missing",
      editions: [
        {
          year: 2027,
          country: "XX",
          submissions: [
            { track: "papers", deadline: "2026-09-01", notification: "2026-08-01" },
            { track: "papers", deadline: "2026-12-01" }
          ]
        }
      ]
    })
  ]);

  assert.throws(
    () => validate(broken, "fixture"),
    (error) =>
      error instanceof PubVenuesValidationError &&
      error.issues.some((issue) => issue.includes("missing category missing")) &&
      error.issues.some((issue) => issue.includes("notification precedes")) &&
      error.issues.some((issue) => issue.includes("without a distinct round label")) &&
      error.issues.some((issue) => issue.includes("country XX is not in countryContinents"))
  );
});

test("merging upserts editions by year and leaves other years alone", () => {
  const original = documentWith([
    venue({
      editions: [
        { year: 2026, location: "Old", submissions: [{ track: "papers", deadline: "2026-01-01" }] },
        { year: 2027, submissions: [{ track: "papers", deadline: "2026-12-01", estimated: true }] }
      ]
    })
  ]);
  const { document, changes } = mergePubVenues(
    original,
    [
      {
        key: "demo",
        tags: ["mine"],
        editions: [
          { year: 2028, submissions: [] },
          { year: 2027, submissions: [{ track: "papers", deadline: "2026-12-05" }] }
        ]
      }
    ],
    "2026-11-01"
  );

  const [merged] = document.venues;
  assert.deepEqual(merged.editions.map((edition) => edition.year), [2026, 2027, 2028]);
  assert.equal(merged.editions[0].location, "Old");
  assert.deepEqual(merged.editions[1].submissions, [{ track: "papers", deadline: "2026-12-05" }]);
  assert.deepEqual(merged.tags, ["mine"]);
  assert.equal(document.updated, "2026-11-01");
  assert.equal(original.venues[0].editions.length, 2);
  assert.deepEqual(changes, [
    "demo: updated tags",
    "demo 2028: added edition",
    "demo 2027: replaced edition"
  ]);

  const unchanged = mergePubVenues(original, [{ key: "demo", tags: [] }], "2026-11-01");
  assert.deepEqual(unchanged.changes, []);
  assert.equal(unchanged.document.updated, original.updated);
});

test("refresh candidates flag closed, projected and unchecked venues", () => {
  const now = Date.parse("2026-10-22T00:00:00Z");
  const document = documentWith([
    venue({
      key: "fresh",
      editions: [
        { year: 2027, checked: "2026-10-01", submissions: [{ track: "papers", deadline: "2027-01-10" }] }
      ]
    }),
    venue({
      key: "closed",
      editions: [
        { year: 2026, checked: "2026-10-01", submissions: [{ track: "papers", deadline: "2026-03-01" }] }
      ]
    }),
    venue({
      key: "projected",
      editions: [
        {
          year: 2027,
          checked: "2026-10-01",
          submissions: [{ track: "papers", deadline: "2027-03-01", estimated: true }]
        }
      ]
    }),
    venue({
      key: "old",
      editions: [
        { year: 2027, checked: "2026-07-01", submissions: [{ track: "papers", deadline: "2027-03-01" }] }
      ]
    }),
    venue({ key: "archived", tracked: false })
  ]);

  assert.deepEqual(
    venuesNeedingRefresh(document, now, 60).map(({ key, reasons }) => ({ key, reasons })),
    [
      { key: "closed", reasons: ["no-open-deadline"] },
      { key: "projected", reasons: ["estimated"] },
      { key: "old", reasons: ["stale-check"] }
    ]
  );
});

test("continent filter and grouping follow the shown edition's country", () => {
  const now = Date.parse("2026-10-22T00:00:00Z");
  const document = documentWith([
    venue({
      key: "moved",
      acronym: "MOVED",
      editions: [
        { year: 2026, country: "US", start: "2026-06-01", submissions: [{ track: "papers", deadline: "2026-01-01" }] },
        { year: 2027, country: "IT", submissions: [{ track: "papers", deadline: "2027-01-01" }] }
      ]
    }),
    venue({
      key: "tokyo",
      acronym: "TOKYO",
      editions: [{ year: 2027, country: "JP", submissions: [{ track: "papers", deadline: "2027-02-01" }] }]
    }),
    venue({
      key: "tba",
      acronym: "TBA",
      editions: [{ year: 2027, submissions: [{ track: "papers", deadline: "2027-03-01" }] }]
    })
  ]);
  const rows = buildRows(document, now, "papers");
  const keys = (continents: string[]) =>
    filterRows(rows, { ...defaultViewState, continents }, new Map()).map((row) => row.venue.key);

  assert.deepEqual(keys(["europe"]), ["moved"]);
  assert.deepEqual(keys(["north-america"]), []);
  assert.deepEqual(keys(["asia", "tba"]), ["tokyo", "tba"]);
  assert.deepEqual(
    groupRows(rows, "continent", document.categories, now).map((group) => `${group.id}:${group.rows.length}`),
    ["europe:1", "asia:1", "tba:1"]
  );
});

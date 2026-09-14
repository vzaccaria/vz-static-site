import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  CourseManifestValidationError,
  createCourseManifestValidator,
  loadCourseManifests,
  resolveCourseResourceGroups,
} from "../src/data/course-manifests";

const manifestRoot = path.join(process.cwd(), "data/course-manifests");

test("loads every committed AOS edition", async () => {
  const records = await loadCourseManifests(manifestRoot);

  assert.deepEqual(
    records.map(({ academicYear, courseSlug }) => ({ academicYear, courseSlug })),
    [
      { academicYear: "2026-2027", courseSlug: "aos" },
      { academicYear: "2025-2026", courseSlug: "aos" },
    ],
  );
});

test("rejects unresolved event references", async () => {
  const schema = JSON.parse(
    await readFile(
      path.join(manifestRoot, "schema/website-manifest-v1.schema.json"),
      "utf8",
    ),
  );
  const validate = createCourseManifestValidator(schema);
  const records = await loadCourseManifests(manifestRoot);
  const archived = structuredClone(
    records.find(({ academicYear }) => academicYear === "2025-2026")!.manifest,
  );
  archived.schedule.events[0].artifacts = ["missing-artifact"];

  assert.throws(
    () => validate(archived, "broken fixture", "2025-2026"),
    (error) =>
      error instanceof CourseManifestValidationError &&
      error.issues.some((issue) =>
        issue.includes("references missing id missing-artifact"),
      ),
  );
});


test("resource groups preserve explicit membership regardless of events and URLs", async () => {
  const records = await loadCourseManifests(manifestRoot);
  const manifest = structuredClone(records[0].manifest);
  const groups = resolveCourseResourceGroups(manifest);
  assert.deepEqual(groups.map((g) => g.id), manifest.resource_groups.map((g) => g.id));
  assert.ok(groups.some((g) => g.id === "teaching-material"));
  assert.deepEqual(groups.find((g) => g.id === "laboratories")!.external_links.map((l) => l.id), ["course-labs"]);
  const projects = groups.find((g) => g.id === "projects")!;
  assert.ok(projects.artifacts.some((a) => a.id === "slides-projects"));
  assert.ok(projects.external_links.some((l) => l.id === "project-report-template"));
  manifest.schedule.events = [];
  assert.deepEqual(resolveCourseResourceGroups(manifest), groups);
  manifest.external_links.push({ id: "unassigned", title: "Not a section", href: "https://github.com/example/example" });
  assert.deepEqual(resolveCourseResourceGroups(manifest), groups);
});

test("rejects unresolved group links and empty groups", async () => {
  const schema = JSON.parse(await readFile(path.join(manifestRoot, "schema/website-manifest-v1.schema.json"), "utf8"));
  const validate = createCourseManifestValidator(schema);
  const records = await loadCourseManifests(manifestRoot);
  for (const external_links of [["missing"], ["slides-projects"], []]) {
    const manifest = structuredClone(records[0].manifest);
    manifest.resource_groups[0].artifacts = [];
    manifest.resource_groups[0].external_links = external_links;
    assert.throws(() => validate(manifest, "bad group", "2026-2027"), CourseManifestValidationError);
  }
});

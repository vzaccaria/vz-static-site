import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  CourseManifestValidationError,
  createCourseManifestValidator,
  loadCourseManifests,
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

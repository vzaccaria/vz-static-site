#!/usr/bin/env tsx

import process from "node:process";
import { loadCourseManifests } from "../src/data/course-manifests";

async function main() {
  const records = await loadCourseManifests();
  if (records.length === 0) {
    throw new Error("Expected at least one course manifest");
  }

  console.log(
    `Validated course manifests (${records.map((record) => `${record.courseSlug} ${record.academicYear}`).join(", ")}).`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

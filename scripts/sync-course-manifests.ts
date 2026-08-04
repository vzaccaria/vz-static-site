#!/usr/bin/env tsx

import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { parse as parseYaml } from "yaml";
import { createCourseManifestValidator } from "../src/data/course-manifests";

const sourceRoot = path.resolve(
  process.cwd(),
  process.env.MATERIALE_CORSI_ROOT ?? "../materiale-corsi",
);
const sourceCourseRoot = path.join(sourceRoot, "aos/courses");
const sourceSchemaPath = path.join(
  sourceRoot,
  "aos/website/schema/website-manifest-v1.schema.json",
);
const destinationRoot = path.join(process.cwd(), "data/course-manifests");

async function main() {
  const schemaSource = await readFile(sourceSchemaPath, "utf8");
  const validate = createCourseManifestValidator(JSON.parse(schemaSource));
  const academicYears = (await readdir(sourceCourseRoot, { withFileTypes: true }))
    .filter(
      (entry) => entry.isDirectory() && /^\d{4}-\d{4}$/.test(entry.name),
    )
    .map((entry) => entry.name)
    .sort();
  const snapshots: Array<{ academicYear: string; source: string }> = [];

  for (const academicYear of academicYears) {
    const manifestPath = path.join(
      sourceCourseRoot,
      academicYear,
      "website.yaml",
    );

    try {
      const source = await readFile(manifestPath, "utf8");
      validate(parseYaml(source), manifestPath, academicYear);
      snapshots.push({ academicYear, source });
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        continue;
      }
      throw error;
    }
  }

  if (snapshots.length === 0) {
    throw new Error(`No AOS website manifests found under ${sourceCourseRoot}`);
  }

  await rm(destinationRoot, { recursive: true, force: true });
  await mkdir(path.join(destinationRoot, "schema"), { recursive: true });
  await mkdir(path.join(destinationRoot, "aos"), { recursive: true });
  await writeFile(
    path.join(destinationRoot, "schema/website-manifest-v1.schema.json"),
    schemaSource,
  );

  for (const snapshot of snapshots) {
    await writeFile(
      path.join(destinationRoot, "aos", `${snapshot.academicYear}.yaml`),
      snapshot.source,
    );
  }

  console.log(
    `Synced ${snapshots.length} AOS course manifests from ${sourceCourseRoot}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

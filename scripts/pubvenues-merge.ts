#!/usr/bin/env tsx
// Merges refresh patches into data/pubvenues/venues.json after validating the
// result. Each patch file holds a JSON array of PubVenuePatch objects.
// Usage: npm run venues:merge -- [--dry-run] <patch.json>...

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";
import {
  createPubVenuesValidator,
  loadPubVenues,
  mergePubVenues,
  type PubVenuePatch
} from "../src/data/pubvenues";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { "dry-run": { type: "boolean", default: false } }
});
if (positionals.length === 0) {
  console.error("Usage: npm run venues:merge -- [--dry-run] <patch.json>...");
  process.exit(1);
}

const root = path.join(process.cwd(), "data/pubvenues");
const filePath = path.join(root, "venues.json");

try {
  const patches: PubVenuePatch[] = [];
  for (const patchPath of positionals) {
    const content: unknown = JSON.parse(await readFile(patchPath, "utf8"));
    if (!Array.isArray(content) || content.some((patch) => typeof patch?.key !== "string")) {
      throw new Error(`${patchPath} must be a JSON array of objects with a string "key"`);
    }
    patches.push(...content);
  }

  const today = new Date().toISOString().slice(0, 10);
  const { document, changes } = mergePubVenues(await loadPubVenues(root), patches, today);
  const schema = JSON.parse(
    await readFile(path.join(root, "schema/pubvenues-v1.schema.json"), "utf8")
  );
  createPubVenuesValidator(schema)(document, `${filePath} (merged)`);

  console.log(changes.length ? changes.join("\n") : "No changes.");
  if (changes.length && !values["dry-run"]) {
    await writeFile(filePath, `${JSON.stringify(document, null, 2)}\n`);
    console.log(`Wrote ${filePath} (updated ${document.updated}).`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

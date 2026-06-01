#!/usr/bin/env node

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DEFAULT_ROOT = "data/imported";

const EXPECTED_FILES = [
  "cv-jr.yaml",
  "biblio.bib",
  "bibliov2.json",
  "theses.json",
  "group.md",
  "thesis-short.md",
  "assets/Logo.svg",
  "assets/Logo.png",
  "assets/Logo.pdf"
];

const EXPECTED_DIRS = ["blog", "authors"];

function parseArgs(argv) {
  const options = { root: DEFAULT_ROOT, requireImported: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") {
      options.root = argv[++index] ?? "";
    } else if (arg === "--require-imported") {
      options.requireImported = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage:
  npm run data:check
  npm run data:check:strict

Options:
  --root <dir>            Imported data root. Default: ${DEFAULT_ROOT}
  --require-imported      Fail if the imported data tree is missing.`);
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function listFiles(root, relativeDir = "") {
  const dir = path.join(root, relativeDir);
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(root, relativePath)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files.sort();
}

async function assertFile(root, relativePath, errors) {
  const filePath = path.join(root, relativePath);
  try {
    const info = await stat(filePath);
    if (!info.isFile()) {
      errors.push(`Expected file is not a file: ${relativePath}`);
    } else if (info.size === 0) {
      errors.push(`Expected file is empty: ${relativePath}`);
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      errors.push(`Missing expected file: ${relativePath}`);
    } else {
      throw error;
    }
  }
}

async function assertDir(root, relativePath, errors) {
  const dirPath = path.join(root, relativePath);
  try {
    const info = await stat(dirPath);
    if (!info.isDirectory()) {
      errors.push(`Expected directory is not a directory: ${relativePath}`);
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      errors.push(`Missing expected directory: ${relativePath}`);
    } else {
      throw error;
    }
  }
}

async function validateJsonFile(root, relativePath, errors) {
  try {
    JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
  } catch (error) {
    errors.push(`Invalid JSON in ${relativePath}: ${error.message}`);
  }
}

async function validateImportedTree(options) {
  const root = options.root;
  const rootExists = await exists(root);

  if (!rootExists) {
    if (options.requireImported) {
      throw new Error(
        `Missing ${root}. Run the private exporter from ../vz-personal-store first.`
      );
    }

    console.warn(
      `No ${root} tree found. Skipping imported data validation; run npm run data:check:strict after export.`
    );
    return;
  }

  const errors = [];

  for (const expected of EXPECTED_FILES) {
    await assertFile(root, expected, errors);
  }

  for (const expected of EXPECTED_DIRS) {
    await assertDir(root, expected, errors);
  }

  const files = await listFiles(root);
  for (const file of files.filter((name) => name.endsWith(".json"))) {
    await validateJsonFile(root, file, errors);
  }

  if (errors.length > 0) {
    throw new Error(`Imported data validation failed:\n- ${errors.join("\n- ")}`);
  }

  console.log(`Validated imported data tree: ${root}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await validateImportedTree(options);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

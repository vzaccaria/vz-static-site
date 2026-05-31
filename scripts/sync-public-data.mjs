#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DEFAULT_ALLOWLIST = "data/public-data.allowlist.json";
const DEFAULT_OUTPUT = "src/data/generated/public-data.json";

const SECRET_VALUE_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b(?:ghp|github_pat|sk|xox[baprs])[-_][A-Za-z0-9_=-]{16,}/,
  /\b(?:password|secret|token|credential)\s*[:=]/i
];

function parseArgs(argv) {
  const options = {
    allowlist: DEFAULT_ALLOWLIST,
    output: "",
    source: "",
    check: false,
    dryRun: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--check") {
      options.check = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--source") {
      options.source = argv[++index] ?? "";
    } else if (arg === "--allowlist") {
      options.allowlist = argv[++index] ?? "";
    } else if (arg === "--out") {
      options.output = argv[++index] ?? "";
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
  npm run data:sync -- --source /path/to/private-export.json
  npm run data:check

Options:
  --source <file>      Private export JSON to sanitize. Required unless --check is used.
  --allowlist <file>   Allowlist JSON. Default: ${DEFAULT_ALLOWLIST}
  --out <file>         Public output JSON. Default: ${DEFAULT_OUTPUT}
  --check              Validate the committed public output without rewriting it.
  --dry-run            Print sanitized output instead of writing it.`);
}

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Failed to read JSON from ${filePath}: ${error.message}`);
  }
}

function parseFieldPath(fieldPath) {
  return fieldPath.split(".").map((segment) => {
    if (segment.endsWith("[]")) {
      return { key: segment.slice(0, -2), array: true };
    }
    return { key: segment, array: false };
  });
}

function hasValue(value) {
  if (value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function copyAllowedPath(source, target, segments, fieldPath) {
  if (segments.length === 0) return;

  const [segment, ...rest] = segments;
  if (!source || typeof source !== "object" || !(segment.key in source)) return;

  const value = source[segment.key];

  if (segment.array) {
    if (!Array.isArray(value)) {
      throw new Error(`Field ${fieldPath} expected ${segment.key} to be an array.`);
    }

    if (rest.length === 0) {
      target[segment.key] = cloneJson(value);
      return;
    }

    const outputArray = Array.isArray(target[segment.key])
      ? target[segment.key]
      : value.map(() => ({}));

    value.forEach((item, index) => {
      if (!outputArray[index] || typeof outputArray[index] !== "object") {
        outputArray[index] = {};
      }
      copyAllowedPath(item, outputArray[index], rest, fieldPath);
    });

    const compact = outputArray.filter(hasValue);
    if (compact.length > 0) target[segment.key] = compact;
    return;
  }

  if (rest.length === 0) {
    target[segment.key] = cloneJson(value);
    return;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Field ${fieldPath} expected ${segment.key} to be an object.`);
  }

  const child = target[segment.key] ?? {};
  copyAllowedPath(value, child, rest, fieldPath);
  if (hasValue(child)) target[segment.key] = child;
}

function sanitize(source, allowlist) {
  const output = { schemaVersion: allowlist.version };
  for (const field of allowlist.fields) {
    copyAllowedPath(source, output, parseFieldPath(field), field);
  }
  return output;
}

function flattenLeaves(value, prefix = "") {
  if (Array.isArray(value)) {
    if (value.length === 0) return prefix ? [`${prefix}[]`] : [];
    return value.flatMap((item) => flattenLeaves(item, `${prefix}[]`));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, nested]) =>
      flattenLeaves(nested, prefix ? `${prefix}.${key}` : key)
    );
  }

  return prefix ? [prefix] : [];
}

function pathExists(value, segments) {
  if (segments.length === 0) return value !== undefined;
  const [segment, ...rest] = segments;
  if (!value || typeof value !== "object" || !(segment.key in value)) return false;
  const next = value[segment.key];
  if (!segment.array) return pathExists(next, rest);
  if (!Array.isArray(next) || next.length === 0) return false;
  if (rest.length === 0) return true;
  return next.some((item) => pathExists(item, rest));
}

function walkKeysAndValues(value, visitor, pathParts = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkKeysAndValues(item, visitor, [...pathParts, String(index)]));
    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, nested]) => {
      visitor({ key, value: nested, path: [...pathParts, key].join(".") });
      walkKeysAndValues(nested, visitor, [...pathParts, key]);
    });
  }
}

function validatePublicOutput(output, allowlist) {
  const allowedLeaves = new Set(["schemaVersion", ...allowlist.fields]);
  const errors = [];

  if (output.schemaVersion !== allowlist.version) {
    errors.push(`schemaVersion must be ${allowlist.version}.`);
  }

  for (const requiredPath of allowlist.required ?? []) {
    if (!pathExists(output, parseFieldPath(requiredPath))) {
      errors.push(`Missing required public field: ${requiredPath}`);
    }
  }

  for (const leaf of flattenLeaves(output)) {
    if (!allowedLeaves.has(leaf)) {
      errors.push(`Output contains non-allowlisted field: ${leaf}`);
    }
  }

  const blockedKeyPatterns = (allowlist.blockedKeyPatterns ?? []).map(
    (pattern) => new RegExp(pattern, "i")
  );

  walkKeysAndValues(output, ({ key, value, path: valuePath }) => {
    if (blockedKeyPatterns.some((pattern) => pattern.test(key))) {
      errors.push(`Output contains blocked key at ${valuePath}.`);
    }
    if (
      typeof value === "string" &&
      SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value))
    ) {
      errors.push(`Output contains a secret-looking value at ${valuePath}.`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`Public data validation failed:\n- ${errors.join("\n- ")}`);
  }
}

function stableStringify(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const allowlist = await readJson(options.allowlist);
  const outputPath = options.output || allowlist.output || DEFAULT_OUTPUT;

  if (options.check) {
    const output = await readJson(outputPath);
    validatePublicOutput(output, allowlist);
    console.log(`Validated public data: ${outputPath}`);
    return;
  }

  if (!options.source) {
    throw new Error(
      "Refusing to sync without an explicit --source path. Private exports must stay outside this repository."
    );
  }

  const source = await readJson(options.source);
  const output = sanitize(source, allowlist);
  validatePublicOutput(output, allowlist);

  if (options.dryRun) {
    process.stdout.write(stableStringify(output));
    return;
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, stableStringify(output));
  console.log(`Wrote sanitized public data: ${outputPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

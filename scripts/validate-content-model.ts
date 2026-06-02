#!/usr/bin/env tsx

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import type { z } from "astro/zod";
import {
  authorFrontmatterSchema,
  bibliographySchema,
  blogFrontmatterSchema,
  markdownBodySchema,
  publicCvSchema,
  thesesSchema
} from "../src/data/content-model";

const IMPORT_ROOT = "data/imported";

type ValidationResult = {
  label: string;
  count?: number;
};

function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const fieldPath = issue.path.length > 0 ? issue.path.join(".") : "<root>";
    return `${fieldPath}: ${issue.message}`;
  });
}

function parseFrontmatter(contents: string, label: string) {
  const match = contents.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    throw new Error(`${label}: missing YAML frontmatter block`);
  }

  const frontmatter = parseYaml(match[1]);
  if (!frontmatter || typeof frontmatter !== "object" || Array.isArray(frontmatter)) {
    throw new Error(`${label}: frontmatter must be an object`);
  }

  return {
    frontmatter,
    body: contents.slice(match[0].length).trim()
  };
}

function validateSchema<T>(
  label: string,
  schema: z.ZodType<T>,
  value: unknown
): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`${label} failed schema validation:\n- ${formatIssues(parsed.error).join("\n- ")}`);
  }
  return parsed.data;
}

async function readYamlFile(filePath: string) {
  return parseYaml(await readFile(filePath, "utf8"));
}

async function readJsonFile(filePath: string) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function validateMarkdownFile(filePath: string, label: string) {
  const body = (await readFile(filePath, "utf8")).trim();
  validateSchema(label, markdownBodySchema, body);
  return { label };
}

async function assertLocalMarkdownAssets(filePath: string, body: string) {
  const assetLinks = body.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g);
  for (const match of assetLinks) {
    const rawLink = match[1].split(/[?#]/)[0];
    if (/^[a-z]+:/i.test(rawLink) || rawLink.startsWith("/")) continue;

    const target = path.join(path.dirname(filePath), decodeURIComponent(rawLink));
    try {
      const info = await stat(target);
      if (!info.isFile()) {
        throw new Error(`${filePath}: local asset is not a file: ${rawLink}`);
      }
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        throw new Error(`${filePath}: missing local asset: ${rawLink}`);
      }
      throw error;
    }
  }
}

async function validateAuthors(): Promise<{
  result: ValidationResult;
  authorIds: Set<string>;
}> {
  const authorDir = path.join(IMPORT_ROOT, "authors");
  const files = (await readdir(authorDir)).filter((file) => file.endsWith(".md")).sort();
  const authorIds = new Set<string>();

  for (const file of files) {
    const filePath = path.join(authorDir, file);
    const { frontmatter } = parseFrontmatter(
      await readFile(filePath, "utf8"),
      filePath
    );
    validateSchema(filePath, authorFrontmatterSchema, frontmatter);
    authorIds.add(path.basename(file, ".md"));
  }

  if (files.length === 0) {
    throw new Error(`${authorDir}: expected at least one author file`);
  }

  return {
    result: { label: "authors", count: files.length },
    authorIds
  };
}

async function validateBlogPosts(authorIds: Set<string>): Promise<ValidationResult> {
  const blogDir = path.join(IMPORT_ROOT, "blog");
  const files = (await readdir(blogDir)).filter((file) => file.endsWith(".md")).sort();

  for (const file of files) {
    const filePath = path.join(blogDir, file);
    const { frontmatter, body } = parseFrontmatter(
      await readFile(filePath, "utf8"),
      filePath
    );
    const parsed = validateSchema(filePath, blogFrontmatterSchema, frontmatter);
    validateSchema(`${filePath} body`, markdownBodySchema, body);
    await assertLocalMarkdownAssets(filePath, body);

    for (const authorId of parsed.authors) {
      if (!authorIds.has(authorId)) {
        throw new Error(`${filePath}: unknown author id "${authorId}"`);
      }
    }
  }

  if (files.length === 0) {
    throw new Error(`${blogDir}: expected at least one blog post`);
  }

  return { label: "blog posts", count: files.length };
}

async function main() {
  const results: ValidationResult[] = [];

  validateSchema(
    "public CV",
    publicCvSchema,
    await readYamlFile(path.join(IMPORT_ROOT, "cv-jr.yaml"))
  );
  results.push({ label: "public CV" });

  const bibliography = validateSchema(
    "bibliography",
    bibliographySchema,
    await readJsonFile(path.join(IMPORT_ROOT, "bibliov2.json"))
  );
  results.push({ label: "bibliography records", count: bibliography.records.length });

  const theses = validateSchema(
    "theses",
    thesesSchema,
    await readJsonFile(path.join(IMPORT_ROOT, "theses.json"))
  );
  results.push({ label: "theses", count: theses.theses.length });

  results.push(await validateMarkdownFile(path.join(IMPORT_ROOT, "group.md"), "group markdown"));
  results.push(
    await validateMarkdownFile(path.join(IMPORT_ROOT, "thesis-short.md"), "thesis intro markdown")
  );

  const { result: authorResult, authorIds } = await validateAuthors();
  results.push(authorResult);
  results.push(await validateBlogPosts(authorIds));

  const summary = results
    .map((result) =>
      typeof result.count === "number"
        ? `${result.label}: ${result.count}`
        : result.label
    )
    .join("; ");

  console.log(`Validated content model (${summary}).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

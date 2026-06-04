import { readFileSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import {
  bibliographySchema,
  publicCvSchema,
  thesesSchema,
  type Bibliography,
  type PublicCv,
  type ThesisCatalog
} from "./content-model";

type DateLikeValue = string | number | Date;

const importedFile = (filePath: string) =>
  path.join(process.cwd(), "data/imported", filePath);

const readImportedText = (path: string) =>
  readFileSync(importedFile(path), "utf8").trim();

export const publicCv: PublicCv = publicCvSchema.parse(
  parseYaml(readImportedText("cv-jr.yaml"))
);

export const bibliography: Bibliography = bibliographySchema.parse(
  JSON.parse(readImportedText("bibliov2.json"))
);

export const thesisCatalog: ThesisCatalog = thesesSchema.parse(
  JSON.parse(readImportedText("theses.json"))
);

export const groupStatement = readImportedText("group.md");
export const thesisIntro = readImportedText("thesis-short.md");
export const profileImagePath = "static/images/avatar.jpg";

export const compactWhitespace = (value: string) =>
  value.replace(/\s+/g, " ").trim();

export const toParagraphs = (value: string) =>
  value
    .trim()
    .split(/\n\s*\n/)
    .map(compactWhitespace)
    .filter(Boolean);

export const markdownToPlainText = (value: string) =>
  compactWhitespace(
    value
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[*_`>#]/g, "")
      .replace(/-{3,}/g, " ")
  );

export const excerptFromMarkdown = (value: string, maxLength = 260) => {
  const plainText = markdownToPlainText(value);
  if (plainText.length <= maxLength) return plainText;

  const excerpt = plainText.slice(0, maxLength).replace(/\s+\S*$/, "");
  return `${excerpt}...`;
};

export const formatAcademicYear = (course: {
  aaInit: number;
  aaEnd: number;
}) =>
  course.aaInit === course.aaEnd
    ? `${course.aaInit}`
    : `${course.aaInit}/${String(course.aaEnd).slice(-2)}`;

export const yearOf = (value: DateLikeValue) => {
  if (value instanceof Date) return `${value.getUTCFullYear()}`;
  if (typeof value === "number") {
    return value > 1_000_000_000
      ? `${new Date(value * 1000).getUTCFullYear()}`
      : `${value}`;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? value : `${new Date(parsed).getUTCFullYear()}`;
};

export const sortedCourses = [...publicCv.teaching.courses].sort(
  (left, right) =>
    right.aaInit - left.aaInit ||
    right.aaEnd - left.aaEnd ||
    left.courseName.localeCompare(right.courseName)
);

const latestCourseEndYear = Math.max(
  ...publicCv.teaching.courses.map((course) => course.aaEnd)
);

export const currentCourses = sortedCourses.filter(
  (course) => course.aaEnd === latestCourseEndYear
);

export const coursesByAcademicYear = sortedCourses.reduce<
  Array<{ academicYear: string; courses: typeof sortedCourses }>
>((groups, course) => {
  const academicYear = formatAcademicYear(course);
  const existing = groups.find((group) => group.academicYear === academicYear);

  if (existing) {
    existing.courses.push(course);
  } else {
    groups.push({ academicYear, courses: [course] });
  }

  return groups;
}, []);

export const publicationStats = {
  total: bibliography.records.length,
  journals: bibliography.records.filter((record) => record.type === "journal")
    .length,
  conferences: bibliography.records.filter(
    (record) => record.type === "conference"
  ).length,
  patents: bibliography.records.filter((record) => record.type === "patent")
    .length,
  books: bibliography.records.filter((record) => record.type === "book").length
};

export const latestPublications = [...bibliography.records]
  .sort((left, right) => right.timestamp - left.timestamp)
  .slice(0, 8);

export const researchAreas = publicCv.research.currentGoals.itemized;

export const highlightedGrants = [...publicCv.research.grants]
  .sort((left, right) => {
    const highlightDelta = Number(right.highlight ?? false) - Number(left.highlight ?? false);
    if (highlightDelta !== 0) return highlightDelta;
    return Number(yearOf(right.from)) - Number(yearOf(left.from));
  })
  .slice(0, 6);

export const selectedProjects = publicCv.work.other.projects;

export const sortedTheses = [...thesisCatalog.theses].sort(
  (left, right) =>
    right.prio - left.prio || left.title.localeCompare(right.title)
);

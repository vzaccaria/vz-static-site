import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parse as parseYaml } from "yaml";

export type CourseStaffMember = {
  person: string;
  role: string;
};

export type CoursePerson = {
  id: string;
  name: string;
  email: string;
};

export type CourseArtifact = {
  id: string;
  kind: "file" | "collection";
  media_type?: string;
  title: string;
  href: string;
};

export type CourseResourceGroup = {
  id: string;
  title: string;
  artifacts: string[];
};

export type CourseExternalLink = {
  id: string;
  title: string;
  href: string;
  description?: string;
};

export type CourseAnnouncement = {
  id: string;
  published_at: string;
  title: string;
  body: string;
  artifacts: string[];
};

export type CourseEvent = {
  id: string;
  start: string;
  end: string;
  kind: "lecture" | "laboratory" | "seminar" | "deadline";
  status: "scheduled" | "tentative" | "cancelled" | "completed";
  location: string;
  topic: string;
  people: string[];
  artifacts: string[];
  external_links: string[];
};

export type CourseManifest = {
  schema_version: 1;
  site: {
    title: string;
    short_title: string;
    locale: string;
    timezone: string;
    summary: string;
  };
  course: {
    academic_year: string;
    institution: string;
    staff: CourseStaffMember[];
  };
  people: CoursePerson[];
  publication: {
    artifact_provider: "google-drive";
    root_href: string;
  };
  artifacts: CourseArtifact[];
  resource_groups: CourseResourceGroup[];
  external_links: CourseExternalLink[];
  announcements: CourseAnnouncement[];
  schedule: {
    notice: string;
    events: CourseEvent[];
  };
};

export type CourseManifestRecord = {
  academicYear: string;
  courseSlug: string;
  filePath: string;
  href: string;
  manifest: CourseManifest;
};

export class CourseManifestValidationError extends Error {
  readonly issues: string[];

  constructor(label: string, issues: string[]) {
    super(`Invalid course manifest ${label}:\n- ${issues.join("\n- ")}`);
    this.name = "CourseManifestValidationError";
    this.issues = issues;
  }
}


function collectIds(manifest: CourseManifest, issues: string[]) {
  const ids = new Map<string, string>();
  const collections: Array<[string, Array<{ id: string }>]> = [
    ["people", manifest.people],
    ["artifacts", manifest.artifacts],
    ["resource_groups", manifest.resource_groups],
    ["external_links", manifest.external_links],
    ["announcements", manifest.announcements],
    ["schedule.events", manifest.schedule.events],
  ];

  for (const [collectionName, entries] of collections) {
    entries.forEach((entry, index) => {
      const fieldPath = `${collectionName}[${index}].id`;
      const previousPath = ids.get(entry.id);
      if (previousPath) {
        issues.push(`${fieldPath} duplicates ${entry.id} from ${previousPath}`);
      } else {
        ids.set(entry.id, fieldPath);
      }
    });
  }
}

function checkReferences(manifest: CourseManifest, issues: string[]) {
  const people = new Set(manifest.people.map(({ id }) => id));
  const artifacts = new Set(manifest.artifacts.map(({ id }) => id));
  const externalLinks = new Set(manifest.external_links.map(({ id }) => id));

  const check = (references: string[], knownIds: Set<string>, fieldPath: string) => {
    references.forEach((reference, index) => {
      if (!knownIds.has(reference)) {
        issues.push(`${fieldPath}[${index}] references missing id ${reference}`);
      }
    });
  };

  check(
    manifest.course.staff.map(({ person }) => person),
    people,
    "course.staff.person",
  );

  manifest.resource_groups.forEach((group, index) => {
    check(group.artifacts, artifacts, `resource_groups[${index}].artifacts`);
  });

  manifest.announcements.forEach((announcement, index) => {
    check(announcement.artifacts, artifacts, `announcements[${index}].artifacts`);
  });

  manifest.schedule.events.forEach((event, index) => {
    check(event.people, people, `schedule.events[${index}].people`);
    check(event.artifacts, artifacts, `schedule.events[${index}].artifacts`);
    check(
      event.external_links,
      externalLinks,
      `schedule.events[${index}].external_links`,
    );
  });
}

function driveUrlIssue(href: string, expectedKind: "file" | "collection") {
  const url = new URL(href);

  if (url.protocol !== "https:" || url.hostname !== "drive.google.com") {
    return "must use an https://drive.google.com URL";
  }

  if (expectedKind === "file" && !/^\/file\/d\/[^/]+\/view$/.test(url.pathname)) {
    return "must use the Google Drive file /file/d/<id>/view form";
  }

  if (
    expectedKind === "collection" &&
    !/^\/drive\/folders\/[^/]+$/.test(url.pathname)
  ) {
    return "must use the Google Drive collection /drive/folders/<id> form";
  }

  return undefined;
}

function checkPublication(manifest: CourseManifest, issues: string[]) {
  const rootIssue = driveUrlIssue(manifest.publication.root_href, "collection");
  if (rootIssue) issues.push(`publication.root_href ${rootIssue}`);

  manifest.artifacts.forEach((artifact, index) => {
    const issue = driveUrlIssue(artifact.href, artifact.kind);
    if (issue) issues.push(`artifacts[${index}].href ${issue}`);
  });
}

function checkDates(
  manifest: CourseManifest,
  expectedAcademicYear: string | undefined,
  issues: string[],
) {
  try {
    new Intl.DateTimeFormat(manifest.site.locale, {
      timeZone: manifest.site.timezone,
    });
  } catch {
    issues.push(`site.timezone is not a valid IANA timezone: ${manifest.site.timezone}`);
  }

  const [startYear, endYear] = manifest.course.academic_year.split("-").map(Number);
  if (endYear !== startYear + 1) {
    issues.push("course.academic_year must contain consecutive years");
  }

  if (
    expectedAcademicYear &&
    manifest.course.academic_year !== expectedAcademicYear
  ) {
    issues.push(
      `course.academic_year ${manifest.course.academic_year} does not match filename ${expectedAcademicYear}`,
    );
  }

  manifest.schedule.events.forEach((event, index) => {
    if (Date.parse(event.end) <= Date.parse(event.start)) {
      issues.push(`schedule.events[${index}].end must be later than start`);
    }
  });
}

export function createCourseManifestValidator(schema: object) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validateSchema = ajv.compile<CourseManifest>(schema);

  return (
    value: unknown,
    label: string,
    expectedAcademicYear?: string,
  ): CourseManifest => {
    if (!validateSchema(value)) {
      throw new CourseManifestValidationError(
        label,
        (validateSchema.errors ?? []).map(
          (error) =>
            `${error.instancePath || "/"} ${error.message ?? "is invalid"}`,
        ),
      );
    }

    const issues: string[] = [];
    collectIds(value, issues);
    checkReferences(value, issues);
    checkPublication(value, issues);
    checkDates(value, expectedAcademicYear, issues);

    if (issues.length > 0) {
      throw new CourseManifestValidationError(label, issues);
    }

    return value;
  };
}

export async function loadCourseManifests(
  root = path.join(process.cwd(), "data/course-manifests"),
): Promise<CourseManifestRecord[]> {
  const schema = JSON.parse(
    await readFile(
      path.join(root, "schema/website-manifest-v1.schema.json"),
      "utf8",
    ),
  );
  const validate = createCourseManifestValidator(schema);
  const courseDirectories = (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name !== "schema")
    .map((entry) => entry.name)
    .sort();
  const records: CourseManifestRecord[] = [];

  for (const courseSlug of courseDirectories) {
    const courseRoot = path.join(root, courseSlug);
    const files = (await readdir(courseRoot, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith(".yaml"))
      .map((entry) => entry.name)
      .sort();

    for (const file of files) {
      const academicYear = path.basename(file, ".yaml");
      const filePath = path.join(courseRoot, file);
      const manifest = validate(
        parseYaml(await readFile(filePath, "utf8")),
        filePath,
        academicYear,
      );
      records.push({
        academicYear,
        courseSlug,
        filePath,
        href: `/courses/${courseSlug}/${academicYear}/`,
        manifest,
      });
    }
  }

  return records.sort(
    (left, right) =>
      right.academicYear.localeCompare(left.academicYear) ||
      left.courseSlug.localeCompare(right.courseSlug),
  );
}

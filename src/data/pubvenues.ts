import { readFile } from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { deadlineInstant, type PubVenuesDocument } from "./pubvenues-model";

export class PubVenuesValidationError extends Error {
  readonly issues: string[];

  constructor(label: string, issues: string[]) {
    super(`Invalid publication venues ${label}:\n- ${issues.join("\n- ")}`);
    this.name = "PubVenuesValidationError";
    this.issues = issues;
  }
}

function checkInvariants(document: PubVenuesDocument, issues: string[]) {
  const categoryIds = new Set<string>();
  document.categories.forEach((category, index) => {
    if (categoryIds.has(category.id)) {
      issues.push(`categories[${index}].id duplicates ${category.id}`);
    }
    categoryIds.add(category.id);
  });

  const venueKeys = new Set<string>();
  document.venues.forEach((venue, venueIndex) => {
    const venuePath = `venues[${venueIndex}] (${venue.key})`;
    if (venueKeys.has(venue.key)) issues.push(`${venuePath} duplicates key ${venue.key}`);
    venueKeys.add(venue.key);

    if (!categoryIds.has(venue.category)) {
      issues.push(`${venuePath}.category references missing category ${venue.category}`);
    }

    const years = new Set<number>();
    venue.editions.forEach((edition, editionIndex) => {
      const editionPath = `${venuePath}.editions[${editionIndex}] (${edition.year})`;
      if (years.has(edition.year)) issues.push(`${editionPath} duplicates year ${edition.year}`);
      years.add(edition.year);

      if (edition.end && !edition.start) issues.push(`${editionPath} has end without start`);
      if (edition.start && edition.end && edition.end < edition.start) {
        issues.push(`${editionPath}.end precedes start`);
      }

      const rounds = new Set<string>();
      edition.submissions.forEach((submission, submissionIndex) => {
        const submissionPath = `${editionPath}.submissions[${submissionIndex}]`;
        const roundKey = `${submission.track}/${submission.round ?? ""}`;
        if (rounds.has(roundKey)) {
          issues.push(
            `${submissionPath} repeats track ${submission.track} without a distinct round label`
          );
        }
        rounds.add(roundKey);

        if (submission.abstract && submission.abstract > submission.deadline) {
          issues.push(`${submissionPath}.abstract is after the deadline`);
        }
        if (submission.notification && submission.notification < submission.deadline) {
          issues.push(`${submissionPath}.notification precedes the deadline`);
        }
        if (edition.start && submission.deadline > edition.start) {
          issues.push(`${submissionPath}.deadline is after the conference start`);
        }
        try {
          deadlineInstant(submission.deadline, submission.timezone);
        } catch {
          issues.push(`${submissionPath}.timezone is not AoE, UTC, UTC±HH:MM or IANA: ${submission.timezone}`);
        }
      });
    });
  });
}

export function createPubVenuesValidator(schema: object) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validateSchema = ajv.compile<PubVenuesDocument>(schema);

  return (value: unknown, label: string): PubVenuesDocument => {
    if (!validateSchema(value)) {
      throw new PubVenuesValidationError(
        label,
        (validateSchema.errors ?? []).map(
          (error) => `${error.instancePath || "/"} ${error.message ?? "is invalid"}`
        )
      );
    }

    const issues: string[] = [];
    checkInvariants(value, issues);
    if (issues.length > 0) throw new PubVenuesValidationError(label, issues);
    return value;
  };
}

export async function loadPubVenues(
  root = path.join(process.cwd(), "data/pubvenues")
): Promise<PubVenuesDocument> {
  const schema = JSON.parse(
    await readFile(path.join(root, "schema/pubvenues-v1.schema.json"), "utf8")
  );
  const filePath = path.join(root, "venues.json");
  return createPubVenuesValidator(schema)(
    JSON.parse(await readFile(filePath, "utf8")),
    filePath
  );
}

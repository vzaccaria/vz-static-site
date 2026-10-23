import { readFile } from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  countryContinents,
  deadlineInstant,
  type PubEdition,
  type PubVenue,
  type PubVenuesDocument
} from "./pubvenues-model";

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
      if (edition.country && !(edition.country in countryContinents)) {
        issues.push(
          `${editionPath}.country ${edition.country} is not in countryContinents (pubvenues-model.ts)`
        );
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

/**
 * A refresh patch. Unknown keys add a venue (it must then be complete).
 * Known keys overwrite the given venue fields; `editions` are upserted by year,
 * replacing a whole edition object and leaving other years untouched.
 */
export type PubVenuePatch = Partial<Omit<PubVenue, "editions">> & {
  key: string;
  editions?: PubEdition[];
};

export function mergePubVenues(
  document: PubVenuesDocument,
  patches: PubVenuePatch[],
  updated: string
): { document: PubVenuesDocument; changes: string[] } {
  const merged = structuredClone(document);
  const changes: string[] = [];

  for (const patch of patches) {
    const venue = merged.venues.find((entry) => entry.key === patch.key);
    if (!venue) {
      merged.venues.push(structuredClone(patch) as PubVenue);
      changes.push(`${patch.key}: added venue`);
      continue;
    }

    const { editions = [], ...fields } = patch;
    for (const [field, value] of Object.entries(fields)) {
      const target = venue as Record<string, unknown>;
      if (JSON.stringify(target[field]) === JSON.stringify(value)) continue;
      target[field] = structuredClone(value);
      changes.push(`${venue.key}: updated ${field}`);
    }

    for (const edition of editions) {
      const index = venue.editions.findIndex((entry) => entry.year === edition.year);
      if (index === -1) {
        venue.editions.push(structuredClone(edition));
        changes.push(`${venue.key} ${edition.year}: added edition`);
      } else if (JSON.stringify(venue.editions[index]) !== JSON.stringify(edition)) {
        venue.editions[index] = structuredClone(edition);
        changes.push(`${venue.key} ${edition.year}: replaced edition`);
      }
    }
    venue.editions.sort((left, right) => left.year - right.year);
  }

  if (changes.length) merged.updated = updated;
  return { document: merged, changes };
}

export type RefreshReason = "no-open-deadline" | "estimated" | "stale-check";

export type RefreshCandidate = {
  key: string;
  acronym: string;
  reasons: RefreshReason[];
  latestYear?: number;
  lastChecked?: string;
};

/**
 * Tracked venues worth re-verifying: no open paper deadline in any edition,
 * open deadlines that are still projections, or editions last checked more
 * than `maxAgeDays` ago (or never).
 */
export function venuesNeedingRefresh(
  document: PubVenuesDocument,
  now: number,
  maxAgeDays: number
): RefreshCandidate[] {
  const reasonOrder: RefreshReason[] = ["no-open-deadline", "estimated", "stale-check"];
  const oldestFreshCheck = new Date(now - maxAgeDays * 86_400_000).toISOString().slice(0, 10);

  return document.venues
    .filter((venue) => venue.tracked)
    .map((venue) => {
      const open = venue.editions
        .flatMap((edition) => edition.submissions)
        .filter(
          (submission) =>
            submission.track === "papers" &&
            deadlineInstant(submission.deadline, submission.timezone) >= now
        );
      const lastChecked = venue.editions
        .map((edition) => edition.checked)
        .filter((checked): checked is string => checked !== undefined)
        .sort()
        .at(-1);
      const reasons: RefreshReason[] = [];
      if (open.length === 0) reasons.push("no-open-deadline");
      if (open.some((submission) => submission.estimated)) reasons.push("estimated");
      if (!lastChecked || lastChecked < oldestFreshCheck) reasons.push("stale-check");
      return {
        key: venue.key,
        acronym: venue.acronym,
        reasons,
        latestYear: venue.editions.at(-1)?.year,
        lastChecked
      };
    })
    .filter((candidate) => candidate.reasons.length > 0)
    .sort(
      (left, right) =>
        reasonOrder.indexOf(left.reasons[0]) - reasonOrder.indexOf(right.reasons[0]) ||
        (left.lastChecked ?? "").localeCompare(right.lastChecked ?? "") ||
        left.key.localeCompare(right.key)
    );
}

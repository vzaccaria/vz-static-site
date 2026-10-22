#!/usr/bin/env tsx
// Lists tracked venues that need a refresh.
// Usage: npm run venues:stale -- [--days 60] [--json]

import process from "node:process";
import { parseArgs } from "node:util";
import { loadPubVenues, venuesNeedingRefresh } from "../src/data/pubvenues";

const { values } = parseArgs({
  options: {
    days: { type: "string", default: "60" },
    json: { type: "boolean", default: false }
  }
});
const days = Number(values.days);
if (!Number.isInteger(days) || days < 0) {
  console.error(`--days must be a non-negative integer, got ${values.days}`);
  process.exit(1);
}

const document = await loadPubVenues();
const candidates = venuesNeedingRefresh(document, Date.now(), days);

if (values.json) {
  console.log(JSON.stringify(candidates, null, 2));
} else {
  for (const candidate of candidates) {
    console.log(
      [
        candidate.key.padEnd(14),
        String(candidate.latestYear ?? "-").padEnd(6),
        (candidate.lastChecked ?? "never").padEnd(11),
        candidate.reasons.join(",")
      ].join(" ")
    );
  }
  const tracked = document.venues.filter((venue) => venue.tracked).length;
  console.log(`${candidates.length} of ${tracked} tracked venues need a refresh (check age > ${days} days).`);
}

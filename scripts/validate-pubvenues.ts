#!/usr/bin/env tsx

import process from "node:process";
import { loadPubVenues } from "../src/data/pubvenues";

loadPubVenues()
  .then((document) => {
    const tracked = document.venues.filter((venue) => venue.tracked).length;
    console.log(
      `Validated publication venues (${document.venues.length} venues, ${tracked} tracked, updated ${document.updated}).`
    );
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });

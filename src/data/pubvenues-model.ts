// Client-safe model for /tools/pubvenues: types, deadline arithmetic, row
// selection, filtering, sorting, grouping and HTML rendering. Imported both by
// the Astro page (build-time render) and by its client script (live render).

export type PubTrack = "papers" | "posters" | "artifacts" | "workshops";

export type PubSubmission = {
  track: PubTrack;
  round?: string;
  abstract?: string;
  deadline: string;
  notification?: string;
  timezone?: string;
  estimated?: boolean;
  url?: string;
  note?: string;
};

export type PubEdition = {
  year: number;
  name?: string;
  url?: string;
  program?: string;
  location?: string;
  start?: string;
  end?: string;
  submissions: PubSubmission[];
  checked?: string;
  source?: string;
  note?: string;
};

export type PubRanking = {
  source: string;
  value: string | number;
  year?: number;
  url?: string;
  note?: string;
};

export type PubVenue = {
  key: string;
  acronym: string;
  name: string;
  kind: "conference" | "symposium" | "workshop";
  category: string;
  tags: string[];
  publisher?: string;
  url?: string;
  proceedings?: string;
  dblp?: string;
  rankings: PubRanking[];
  tracked: boolean;
  editions: PubEdition[];
  note?: string;
};

export type PubCategory = { id: string; label: string };

export type PubVenuesDocument = {
  schema_version: 1;
  updated: string;
  categories: PubCategory[];
  venues: PubVenue[];
};

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

/** UTC offset in minutes of an IANA zone at a given instant. */
function ianaOffsetMinutes(timeZone: string, instant: number): number {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset"
  })
    .formatToParts(instant)
    .find((part) => part.type === "timeZoneName")?.value;
  const match = /^GMT(?:([+-])(\d{2}):(\d{2}))?$/.exec(name ?? "");
  if (!match) throw new Error(`Cannot resolve offset for timezone ${timeZone}`);
  if (!match[1]) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === "-" ? -minutes : minutes;
}

/**
 * Last millisecond of `date` (YYYY-MM-DD) in `timezone`: "AoE" (UTC-12,
 * default), "UTC", "UTC±HH:MM", or an IANA zone. Throws on unknown zones.
 */
export function deadlineInstant(date: string, timezone = "AoE"): number {
  const [year, month, day] = date.split("-").map(Number);
  const wallClockEnd = Date.UTC(year, month - 1, day, 23, 59, 59, 999);
  if (timezone === "AoE") return wallClockEnd + 12 * HOUR_MS;
  if (timezone === "UTC") return wallClockEnd;

  const fixed = /^UTC([+-])(\d{2}):(\d{2})$/.exec(timezone);
  if (fixed) {
    const minutes = Number(fixed[2]) * 60 + Number(fixed[3]);
    return wallClockEnd - (fixed[1] === "-" ? -minutes : minutes) * MINUTE_MS;
  }

  // Two passes settle the offset across DST transitions.
  let instant = wallClockEnd - ianaOffsetMinutes(timezone, wallClockEnd) * MINUTE_MS;
  instant = wallClockEnd - ianaOffsetMinutes(timezone, instant) * MINUTE_MS;
  return instant;
}

/** Start of a calendar date in UTC; conference dates are local and coarse. */
function dayStart(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

export type Urgency = "far" | "soon" | "imminent" | "past" | "none";

export const urgencyLabels: Record<Urgency, string> = {
  far: "> 60 days",
  soon: "≤ 60 days",
  imminent: "≤ 30 days",
  past: "Past",
  none: "No date"
};

export function urgencyOf(instant: number | undefined, now: number): Urgency {
  if (instant === undefined) return "none";
  const days = (instant - now) / DAY_MS;
  if (days < 0) return "past";
  if (days <= 30) return "imminent";
  if (days <= 60) return "soon";
  return "far";
}

export type TrackFilter = "papers" | "all";

export type TimedSubmission = PubSubmission & { instant: number };

export type PubRow = {
  venue: PubVenue;
  edition?: PubEdition;
  submissions: TimedSubmission[];
  next?: TimedSubmission;
  last?: TimedSubmission;
  conferenceInstant?: number;
  conferenceEndInstant?: number;
  core?: string;
  h5?: number;
};

/**
 * One row per tracked venue. The shown edition is, in order: the one with the
 * earliest upcoming deadline (in the selected tracks), the earliest edition
 * whose conference has not ended yet, the most recent edition.
 */
export function buildRows(
  document: PubVenuesDocument,
  now: number,
  track: TrackFilter
): PubRow[] {
  return document.venues
    .filter((venue) => venue.tracked)
    .map((venue) => {
      const editions = [...venue.editions].sort((left, right) => left.year - right.year);
      const candidates = editions.map((edition) => {
        const submissions: TimedSubmission[] = edition.submissions
          .filter((submission) => track === "all" || submission.track === track)
          .map((submission) => ({
            ...submission,
            instant: deadlineInstant(submission.deadline, submission.timezone)
          }))
          .sort((left, right) => left.instant - right.instant);
        const next = submissions.find((submission) => submission.instant >= now);
        const endDate = edition.end ?? edition.start;
        const conferenceEndInstant = endDate
          ? dayStart(endDate) + DAY_MS - 1
          : undefined;
        return { edition, submissions, next, conferenceEndInstant };
      });

      const chosen =
        candidates
          .filter((candidate) => candidate.next)
          .sort((left, right) => left.next!.instant - right.next!.instant)[0] ??
        candidates.find(
          (candidate) =>
            candidate.conferenceEndInstant !== undefined &&
            candidate.conferenceEndInstant >= now
        ) ??
        candidates.at(-1);

      const core = venue.rankings.find((ranking) => ranking.source === "CORE")?.value;
      const h5 = venue.rankings.find((ranking) => ranking.source === "h5")?.value;
      const row: PubRow = {
        venue,
        submissions: chosen?.submissions ?? [],
        core: core === undefined ? undefined : String(core),
        h5: typeof h5 === "number" ? h5 : h5 === undefined ? undefined : Number(h5)
      };
      if (chosen) {
        row.edition = chosen.edition;
        row.next = chosen.next;
        row.last = chosen.submissions.filter((s) => s.instant < now).at(-1);
        row.conferenceInstant = chosen.edition.start
          ? dayStart(chosen.edition.start)
          : undefined;
        row.conferenceEndInstant = chosen.conferenceEndInstant;
      }
      return row;
    });
}

export const sortKeys = ["deadline", "conference", "venue", "core", "h5"] as const;
export type SortKey = (typeof sortKeys)[number];
export const groupKeys = ["none", "category", "core", "urgency", "month", "publisher"] as const;
export type GroupKey = (typeof groupKeys)[number];
export const colorKeys = ["deadline", "conference", "none"] as const;
export type ColorKey = (typeof colorKeys)[number];

export type ViewState = {
  q: string;
  categories: string[];
  core: string[];
  tags: string[];
  track: TrackFilter;
  upcoming: boolean;
  group: GroupKey;
  sort: SortKey;
  dir: "asc" | "desc";
  color: ColorKey;
};

export const defaultViewState: ViewState = {
  q: "",
  categories: [],
  core: [],
  tags: [],
  track: "papers",
  upcoming: false,
  group: "category",
  sort: "deadline",
  dir: "asc",
  color: "deadline"
};

/** CORE buckets offered as filters; anything else falls into "other". */
export const coreBuckets = ["A*", "A", "B", "C", "other", "none"] as const;

export function coreBucket(core: string | undefined): string {
  if (core === undefined) return "none";
  return (coreBuckets as readonly string[]).includes(core) ? core : "other";
}

const isOneOf = <T extends string>(values: readonly T[], value: string | null): value is T =>
  value !== null && (values as readonly string[]).includes(value);

export function parseViewState(params: URLSearchParams): ViewState {
  const list = (name: string) =>
    (params.get(name) ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  const group = params.get("group");
  const sort = params.get("sort");
  const color = params.get("color");
  return {
    q: params.get("q") ?? "",
    categories: list("cat"),
    core: list("core"),
    tags: list("tag"),
    track: params.get("track") === "all" ? "all" : "papers",
    upcoming: params.get("upcoming") === "1",
    group: isOneOf(groupKeys, group) ? group : defaultViewState.group,
    sort: isOneOf(sortKeys, sort) ? sort : defaultViewState.sort,
    dir: params.get("dir") === "desc" ? "desc" : "asc",
    color: isOneOf(colorKeys, color) ? color : defaultViewState.color
  };
}

export function serializeViewState(state: ViewState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.categories.length) params.set("cat", state.categories.join(","));
  if (state.core.length) params.set("core", state.core.join(","));
  if (state.tags.length) params.set("tag", state.tags.join(","));
  if (state.track !== defaultViewState.track) params.set("track", state.track);
  if (state.upcoming) params.set("upcoming", "1");
  if (state.group !== defaultViewState.group) params.set("group", state.group);
  if (state.sort !== defaultViewState.sort) params.set("sort", state.sort);
  if (state.dir !== defaultViewState.dir) params.set("dir", state.dir);
  if (state.color !== defaultViewState.color) params.set("color", state.color);
  return params;
}

function searchText(row: PubRow, categoryLabel: string) {
  return [
    row.venue.acronym,
    row.venue.name,
    row.venue.key,
    row.venue.publisher,
    categoryLabel,
    row.edition?.name,
    row.edition?.location,
    ...row.venue.tags
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function filterRows(
  rows: PubRow[],
  state: ViewState,
  categoryLabels: Map<string, string>
): PubRow[] {
  const terms = state.q.toLowerCase().split(/\s+/).filter(Boolean);
  return rows.filter((row) => {
    if (state.categories.length && !state.categories.includes(row.venue.category)) {
      return false;
    }
    if (state.core.length && !state.core.includes(coreBucket(row.core))) return false;
    if (state.tags.length && !state.tags.some((tag) => row.venue.tags.includes(tag))) {
      return false;
    }
    if (state.upcoming && !row.next) return false;
    if (terms.length) {
      const haystack = searchText(row, categoryLabels.get(row.venue.category) ?? "");
      if (!terms.every((term) => haystack.includes(term))) return false;
    }
    return true;
  });
}

/** Rows without a value for the sort key always sink to the bottom. */
export function sortRows(rows: PubRow[], sort: SortKey, dir: "asc" | "desc"): PubRow[] {
  const sign = dir === "asc" ? 1 : -1;
  const value = (row: PubRow): number | string | undefined => {
    switch (sort) {
      case "deadline":
        return row.next?.instant;
      case "conference":
        return row.conferenceInstant;
      case "venue":
        return row.venue.acronym.toLowerCase();
      case "core":
        return (coreBuckets as readonly string[]).indexOf(coreBucket(row.core));
      case "h5":
        return row.h5 === undefined ? undefined : -row.h5;
    }
  };
  return [...rows].sort((left, right) => {
    const a = value(left);
    const b = value(right);
    if (a === undefined || b === undefined) {
      if (a === b) return left.venue.acronym.localeCompare(right.venue.acronym);
      return a === undefined ? 1 : -1;
    }
    const order = a < b ? -1 : a > b ? 1 : 0;
    return order * sign || left.venue.acronym.localeCompare(right.venue.acronym);
  });
}

export type RowGroup = { id: string; label: string; rows: PubRow[] };

const monthFormat = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC"
});

export function groupRows(
  rows: PubRow[],
  group: GroupKey,
  categories: PubCategory[],
  now: number
): RowGroup[] {
  if (group === "none") return [{ id: "all", label: "", rows }];

  const groups = new Map<string, RowGroup>();
  const order: string[] = [];
  const keyOf = (row: PubRow): { id: string; label: string; rank: string } => {
    switch (group) {
      case "category": {
        const index = categories.findIndex((category) => category.id === row.venue.category);
        return {
          id: row.venue.category,
          label: categories[index]?.label ?? row.venue.category,
          rank: String(index).padStart(3, "0")
        };
      }
      case "core": {
        const bucket = coreBucket(row.core);
        const label = bucket === "none" ? "Unranked" : bucket === "other" ? "Other" : `CORE ${bucket}`;
        return { id: bucket, label, rank: String((coreBuckets as readonly string[]).indexOf(bucket)) };
      }
      case "urgency": {
        const urgency = urgencyOf(row.next?.instant, now);
        const rank = ["imminent", "soon", "far", "past", "none"].indexOf(urgency);
        const label = urgency === "none" ? "No upcoming deadline" : urgencyLabels[urgency];
        return { id: urgency, label, rank: String(rank) };
      }
      case "month": {
        if (!row.next) return { id: "none", label: "No upcoming deadline", rank: "9999-99" };
        const date = new Date(row.next.instant - 12 * HOUR_MS);
        const id = row.next.deadline.slice(0, 7);
        return { id, label: monthFormat.format(date), rank: id };
      }
      case "publisher": {
        const publisher = row.venue.publisher;
        return publisher
          ? { id: publisher, label: publisher.toUpperCase(), rank: publisher }
          : { id: "none", label: "Unknown publisher", rank: "~" };
      }
    }
  };

  for (const row of rows) {
    const key = keyOf(row);
    if (!groups.has(key.id)) {
      groups.set(key.id, { id: key.id, label: key.label, rows: [] });
      order.push(`${key.rank}\u0000${key.id}`);
    }
    groups.get(key.id)!.rows.push(row);
  }
  return order.sort().map((entry) => groups.get(entry.split("\u0000")[1])!);
}

// ---------------------------------------------------------------- rendering

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const link = (href: string | undefined, label: string, className = "") =>
  href
    ? `<a href="${escapeHtml(href)}"${className ? ` class="${className}"` : ""} rel="noopener" target="_blank">${label}</a>`
    : label;

const shortDate = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC"
});

const formatDate = (date: string) => shortDate.format(new Date(`${date}T00:00:00Z`));

function formatRange(start?: string, end?: string) {
  if (!start) return "";
  if (!end || end === start) return formatDate(start);
  const [sy, sm] = start.split("-");
  const [ey, em, ed] = end.split("-");
  const startLabel = formatDate(start);
  if (sy === ey && sm === em) return `${startLabel.slice(0, 2)}–${ed} ${startLabel.slice(3)}`;
  return `${formatDate(start)} – ${formatDate(end)}`;
}

function relativeDays(instant: number, now: number) {
  const days = Math.ceil((instant - now) / DAY_MS);
  if (days <= 0) return "today";
  return days === 1 ? "in 1 day" : `in ${days} days`;
}

const trackLabels: Record<PubTrack, string> = {
  papers: "Papers",
  posters: "Posters",
  artifacts: "Artifacts",
  workshops: "Workshops"
};

function renderSubmission(submission: TimedSubmission, row: PubRow, now: number, track: TrackFilter) {
  const state =
    submission === row.next ? "next" : submission.instant < now ? "past" : "later";
  const labels = [
    track === "all" && submission.track !== "papers" ? trackLabels[submission.track] : "",
    submission.round ?? ""
  ].filter(Boolean);
  const timezone = submission.timezone && submission.timezone !== "AoE" ? ` ${submission.timezone}` : "";
  const parts = [
    labels.length ? `<span class="pv-sub__round">${escapeHtml(labels.join(" · "))}</span>` : "",
    submission.abstract
      ? `<span class="pv-sub__abstract">abs ${formatDate(submission.abstract)}</span>`
      : "",
    `<span class="pv-sub__deadline">${link(submission.url, formatDate(submission.deadline))}${escapeHtml(timezone)}</span>`,
    submission.notification
      ? `<span class="pv-sub__notification">→ ${formatDate(submission.notification)}</span>`
      : "",
    state === "next"
      ? `<span class="pv-sub__countdown">${relativeDays(submission.instant, now)}</span>`
      : "",
    submission.estimated ? `<span class="pv-sub__estimated" title="Projected from a previous edition">est.</span>` : ""
  ].filter(Boolean);
  const title = submission.note ? ` title="${escapeHtml(submission.note)}"` : "";
  return `<li class="pv-sub pv-sub--${state}${submission.estimated ? " pv-sub--estimated" : ""}" data-urgency="${urgencyOf(submission.instant, now)}"${title}>${parts.join(" ")}</li>`;
}

function renderRow(row: PubRow, state: ViewState, categoryLabels: Map<string, string>, now: number) {
  const { venue, edition } = row;
  const colorInstant =
    state.color === "deadline"
      ? row.next?.instant ?? row.last?.instant
      : state.color === "conference"
        ? row.conferenceEndInstant
        : undefined;
  const urgency = state.color === "none" ? "none" : urgencyOf(colorInstant, now);
  const title = `${escapeHtml(venue.acronym)}${edition ? ` ${edition.year}` : ""}`;
  const venueLinks = [
    venue.proceedings ? link(venue.proceedings, "proc") : "",
    venue.dblp ? link(venue.dblp, "dblp") : "",
    edition?.program ? link(edition.program, "program") : ""
  ].filter(Boolean);
  const tags = venue.tags.length
    ? `<span class="pv-tags">${venue.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</span>`
    : "";
  const submissions = row.submissions.length
    ? `<ul class="pv-subs">${row.submissions.map((s) => renderSubmission(s, row, now, state.track)).join("")}</ul>`
    : `<span class="pv-muted">TBA</span>`;
  const core = venue.rankings.find((ranking) => ranking.source === "CORE");
  const h5 = venue.rankings.find((ranking) => ranking.source === "h5");

  return `<tr class="pv-row" data-urgency="${urgency}" data-key="${escapeHtml(venue.key)}">
<td class="pv-cell--core">${core ? link(core.url, escapeHtml(String(core.value))) : `<span class="pv-muted">–</span>`}</td>
<td class="pv-cell--venue"><strong>${link(edition?.url ?? venue.url, title)}</strong><span class="pv-venue__name">${escapeHtml(edition?.name ?? venue.name)}</span>${venueLinks.length ? `<span class="pv-venue__links">${venueLinks.join(" · ")}</span>` : ""}${tags}</td>
<td class="pv-cell--deadlines">${submissions}</td>
<td class="pv-cell--conference">${edition?.start ? `<span>${formatRange(edition.start, edition.end)}</span>` : `<span class="pv-muted">TBA</span>`}${edition?.location ? `<span class="pv-muted">${escapeHtml(edition.location)}</span>` : ""}</td>
<td class="pv-cell--category">${escapeHtml(categoryLabels.get(venue.category) ?? venue.category)}</td>
<td class="pv-cell--h5">${h5 ? link(h5.url, `${escapeHtml(String(h5.value))}${h5.year ? `<small> ’${String(h5.year).slice(2)}</small>` : ""}`) : `<span class="pv-muted">–</span>`}</td>
</tr>`;
}

const columns: Array<{ id: string; label: string; sort?: SortKey }> = [
  { id: "core", label: "CORE", sort: "core" },
  { id: "venue", label: "Venue", sort: "venue" },
  { id: "deadlines", label: "Deadlines → notification", sort: "deadline" },
  { id: "conference", label: "Conference", sort: "conference" },
  { id: "category", label: "Area" },
  { id: "h5", label: "h5", sort: "h5" }
];

export function renderTable(
  document: PubVenuesDocument,
  state: ViewState,
  now: number
): { html: string; count: number; total: number } {
  const categoryLabels = new Map(document.categories.map((c) => [c.id, c.label]));
  const all = buildRows(document, now, state.track);
  const rows = sortRows(filterRows(all, state, categoryLabels), state.sort, state.dir);
  const groups = groupRows(rows, state.group, document.categories, now);

  const head = columns
    .map((column) => {
      const active = column.sort === state.sort;
      const ariaSort = active ? (state.dir === "asc" ? "ascending" : "descending") : "none";
      const inner = column.sort
        ? `<button type="button" data-sort="${column.sort}">${column.label}<span aria-hidden="true">${active ? (state.dir === "asc" ? " ▲" : " ▼") : ""}</span></button>`
        : column.label;
      return `<th scope="col" class="pv-cell--${column.id}"${column.sort ? ` aria-sort="${ariaSort}"` : ""}>${inner}</th>`;
    })
    .join("");

  const body = groups
    .map((group) => {
      const header =
        state.group === "none"
          ? ""
          : `<tr class="pv-group"><th colspan="${columns.length}" scope="rowgroup">${escapeHtml(group.label)} <span>${group.rows.length}</span></th></tr>`;
      return `<tbody>${header}${group.rows.map((row) => renderRow(row, state, categoryLabels, now)).join("")}</tbody>`;
    })
    .join("");

  const empty = rows.length
    ? ""
    : `<tbody><tr><td class="pv-empty" colspan="${columns.length}">No venue matches the current filters.</td></tr></tbody>`;

  return {
    html: `<table class="pv-table"><thead><tr>${head}</tr></thead>${body}${empty}</table>`,
    count: rows.length,
    total: all.length
  };
}

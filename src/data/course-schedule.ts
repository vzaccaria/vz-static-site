import type { CourseEvent, CourseManifest } from "./course-manifests";

export type CourseMaterial = {
  label: string;
  title: string;
  href: string;
  download: boolean;
};

export type CourseLink = { title: string; href: string };

export type CourseScheduleRow = {
  event: CourseEvent;
  weekday: string;
  day: string;
  date: string;
  time: string;
  regularTime: boolean;
  kind: string;
  staff: string[];
  materials: CourseMaterial[];
  links: CourseLink[];
  next: boolean;
};

export type CourseScheduleMonth = {
  key: string;
  label: string;
  rows: CourseScheduleRow[];
};

export type CourseWeeklySlot = {
  weekday: string;
  time: string;
  location?: string;
};

export type CourseSchedule = {
  months: CourseScheduleMonth[];
  slots: CourseWeeklySlot[];
  next?: CourseScheduleRow;
  statusCounts: Array<{ status: CourseEvent["status"]; count: number }>;
};

// A weekday/time pair becomes a "regular" weekly slot once it recurs this often.
const REGULAR_SLOT_MIN_EVENTS = 3;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const STATUS_ORDER: CourseEvent["status"][] = [
  "completed",
  "scheduled",
  "tentative",
  "cancelled",
];
const KIND_LABELS: Record<CourseEvent["kind"], string> = {
  lecture: "Lecture",
  laboratory: "Lab",
  seminar: "Seminar",
  deadline: "Deadline",
};
// Per-event quick materials are recognised by id prefix, in this display order;
// any other event reference stays a titled link.
const MATERIAL_KINDS = [
  { prefix: "slides-", label: "Slides" },
  { prefix: "notes-", label: "Notes" },
  { prefix: "recording-", label: "Video" },
];

export function driveDownloadHref(href: string) {
  const fileId = new URL(href).pathname.match(/^\/file\/d\/([^/]+)\/view$/)?.[1];
  return fileId
    ? `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`
    : href;
}

export function buildCourseSchedule(manifest: CourseManifest): CourseSchedule {
  const { locale, timezone: timeZone } = manifest.site;
  const weekdayName = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone });
  const weekdayKey = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone });
  const dayNumber = new Intl.DateTimeFormat(locale, { day: "2-digit", timeZone });
  const shortDate = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone,
  });
  const monthName = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone,
  });
  const monthKey = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone,
  });
  const clock = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  });

  const artifacts = new Map(manifest.artifacts.map((item) => [item.id, item]));
  const links = new Map(manifest.external_links.map((item) => [item.id, item]));
  const people = new Map(manifest.people.map((person) => [person.id, person.name]));
  const lead = manifest.course.staff[0]?.person;
  const events = [...manifest.schedule.events].sort(
    (left, right) => Date.parse(left.start) - Date.parse(right.start),
  );
  const nextEvent = events.find(
    ({ status }) => status === "scheduled" || status === "tentative",
  );

  const slots = new Map<
    string,
    {
      weekdayIndex: number;
      weekday: string;
      time: string;
      count: number;
      locations: Map<string, number>;
    }
  >();
  const timed = events.map((event) => {
    const start = new Date(event.start);
    const time = `${clock.format(start)}–${clock.format(new Date(event.end))}`;
    const weekdayIndex = WEEKDAYS.indexOf(weekdayKey.format(start));
    const key = `${weekdayIndex}|${time}`;
    const slot = slots.get(key) ?? {
      weekdayIndex,
      weekday: weekdayName.format(start),
      time,
      count: 0,
      locations: new Map<string, number>(),
    };
    slot.count += 1;
    if (event.status !== "cancelled") {
      slot.locations.set(event.location, (slot.locations.get(event.location) ?? 0) + 1);
    }
    slots.set(key, slot);
    return { event, start, time, key };
  });

  const months: CourseScheduleMonth[] = [];
  let next: CourseScheduleRow | undefined;
  for (const { event, start, time, key } of timed) {
    const items = [
      ...event.artifacts.map((id) => {
        const artifact = artifacts.get(id)!;
        const download = artifact.kind === "file";
        return {
          id,
          title: artifact.title,
          href: artifact.href,
          materialHref: download ? driveDownloadHref(artifact.href) : artifact.href,
          download,
        };
      }),
      ...event.external_links.map((id) => {
        const link = links.get(id)!;
        return { id, title: link.title, href: link.href, materialHref: link.href, download: false };
      }),
    ];
    const materials = MATERIAL_KINDS.flatMap(({ prefix, label }) => {
      const matches = items.filter(({ id }) => id.startsWith(prefix));
      return matches.map((item, index) => ({
        label: matches.length > 1 ? `${label} ${index + 1}` : label,
        title: item.title,
        href: item.materialHref,
        download: item.download,
      }));
    });
    const row: CourseScheduleRow = {
      event,
      weekday: weekdayName.format(start),
      day: dayNumber.format(start),
      date: shortDate.format(start),
      time,
      regularTime: slots.get(key)!.count >= REGULAR_SLOT_MIN_EVENTS,
      kind: KIND_LABELS[event.kind],
      staff:
        event.people.length === 1 && event.people[0] === lead
          ? []
          : event.people.map((id) => people.get(id)!),
      materials,
      links: items
        .filter(({ id }) => !MATERIAL_KINDS.some(({ prefix }) => id.startsWith(prefix)))
        .map(({ title, href }) => ({ title, href })),
      next: event === nextEvent,
    };
    if (row.next) next = row;

    const month = monthKey.format(start);
    if (months.at(-1)?.key !== month) {
      months.push({ key: month, label: monthName.format(start), rows: [] });
    }
    months.at(-1)!.rows.push(row);
  }

  return {
    months,
    slots: [...slots.values()]
      .filter(({ count }) => count >= REGULAR_SLOT_MIN_EVENTS)
      .sort((left, right) => left.weekdayIndex - right.weekdayIndex || left.time.localeCompare(right.time))
      .map(({ weekday, time, locations }) => ({
        weekday,
        time,
        location: [...locations].sort((left, right) => right[1] - left[1])[0]?.[0],
      })),
    next,
    statusCounts: STATUS_ORDER.map((status) => ({
      status,
      count: events.filter((event) => event.status === status).length,
    })).filter(({ count }) => count > 0),
  };
}

import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import {
  loadCourseManifests,
  type CourseEvent,
  type CourseManifest,
} from "../src/data/course-manifests";
import { buildCourseSchedule } from "../src/data/course-schedule";

const manifestRoot = path.join(process.cwd(), "data/course-manifests");

async function manifestWith(events: Array<Partial<CourseEvent> & Pick<CourseEvent, "id" | "start" | "end">>) {
  const [record] = await loadCourseManifests(manifestRoot);
  const manifest: CourseManifest = structuredClone(record.manifest);
  manifest.schedule.events = events.map((event) => ({
    kind: "lecture",
    status: "completed",
    location: "7.1.3",
    topic: event.id,
    people: [],
    artifacts: [],
    external_links: [],
    ...event,
  }));
  return manifest;
}

const rows = (manifest: CourseManifest) =>
  buildCourseSchedule(manifest).months.flatMap((month) => month.rows);

test("weekly slots use the manifest timezone across DST and ignore one-off events", async () => {
  const manifest = await manifestWith([
    { id: "cest", start: "2026-10-19T12:15:00+02:00", end: "2026-10-19T14:15:00+02:00" },
    { id: "seminar", kind: "seminar", location: "Online", start: "2026-10-22T18:00:00+02:00", end: "2026-10-22T19:00:00+02:00" },
    { id: "cet", start: "2026-10-26T12:15:00+01:00", end: "2026-10-26T14:15:00+01:00" },
    { id: "cancelled", status: "cancelled", location: "Not applicable", start: "2026-11-02T12:15:00+01:00", end: "2026-11-02T14:15:00+01:00" },
  ]);
  const schedule = buildCourseSchedule(manifest);

  assert.deepEqual(schedule.slots, [{ weekday: "Mon", time: "12:15–14:15", location: "7.1.3" }]);
  assert.deepEqual(
    rows(manifest).map(({ event, time, regularTime }) => [event.id, time, regularTime]),
    [
      ["cest", "12:15–14:15", true],
      ["seminar", "18:00–19:00", false],
      ["cet", "12:15–14:15", true],
      ["cancelled", "12:15–14:15", true],
    ],
  );
});

test("next class is the earliest scheduled or tentative event", async () => {
  const manifest = await manifestWith([
    { id: "tentative", status: "tentative", start: "2026-10-20T12:15:00+02:00", end: "2026-10-20T14:15:00+02:00" },
    { id: "scheduled", status: "scheduled", start: "2026-10-12T12:15:00+02:00", end: "2026-10-12T14:15:00+02:00" },
    { id: "cancelled", status: "cancelled", start: "2026-10-09T12:15:00+02:00", end: "2026-10-09T14:15:00+02:00" },
    { id: "completed", start: "2026-10-05T12:15:00+02:00", end: "2026-10-05T14:15:00+02:00" },
  ]);
  const schedule = buildCourseSchedule(manifest);

  assert.equal(schedule.next?.event.id, "scheduled");
  assert.deepEqual(rows(manifest).filter(({ next }) => next).map(({ event }) => event.id), ["scheduled"]);

  for (const event of manifest.schedule.events) event.status = "completed";
  assert.equal(buildCourseSchedule(manifest).next, undefined);
});

test("event materials number repeated kinds and keep other references as links", async () => {
  const manifest = await manifestWith([
    {
      id: "event",
      start: "2026-10-05T12:15:00+02:00",
      end: "2026-10-05T14:15:00+02:00",
      artifacts: ["slides-admin", "syllabus", "slides-intro"],
      external_links: ["webex-room", "recording-2026-10-05"],
    },
  ]);
  const [row] = rows(manifest);

  assert.deepEqual(
    row.materials.map(({ label, download }) => [label, download]),
    [["Slides 1", true], ["Slides 2", true], ["Video", false]],
  );
  assert.match(row.materials[0].href, /^https:\/\/drive\.google\.com\/uc\?export=download&id=/);
  assert.deepEqual(row.links.map(({ title }) => title), ["Course syllabus", "Course instructor Webex room"]);
});

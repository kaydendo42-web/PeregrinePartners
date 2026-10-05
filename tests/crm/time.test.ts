import test from "node:test";
import assert from "node:assert/strict";
import {
  localDate,
  localTimeCandidates,
  localInput,
  dayBounds,
  resolveActivityTime,
} from "../../lib/crm/time.ts";
test("workspace date follows Melbourne midnight, not UTC", () => {
  assert.equal(
    localDate("2026-10-04T13:15:00Z", "Australia/Melbourne"),
    "2026-10-05",
  );
  assert.equal(
    localInput("2026-10-04T13:15:00Z", "Australia/Melbourne"),
    "2026-10-05T00:15",
  );
});
test("backdated activities use workspace time and retain the retry instant", () => {
  const captured = "2026-10-05T22:13:54.000Z";
  assert.equal(
    resolveActivityTime("", "Australia/Melbourne", "", captured),
    captured,
  );
  assert.equal(
    resolveActivityTime(
      "2026-10-05T09:30",
      "Australia/Melbourne",
      "",
      captured,
    ),
    "2026-10-04T22:30:00.000Z",
  );
  assert.throws(
    () =>
      resolveActivityTime(
        "2026-10-04T02:30",
        "Australia/Melbourne",
        "",
        captured,
      ),
    /does not exist/,
  );
  assert.throws(
    () =>
      resolveActivityTime(
        "2026-04-05T02:30",
        "Australia/Melbourne",
        "",
        captured,
      ),
    /occurs twice/,
  );
  assert.equal(
    resolveActivityTime(
      "2026-04-05T02:30",
      "Australia/Melbourne",
      "2026-04-04T16:30:00.000Z",
      captured,
    ),
    "2026-04-04T16:30:00.000Z",
  );
});
test("DST gaps reject impossible times and repeated times need a choice", () => {
  assert.deepEqual(
    localTimeCandidates("2026-10-04T02:30", "Australia/Melbourne"),
    [],
  );
  assert.deepEqual(
    localTimeCandidates("2026-04-05T02:30", "Australia/Melbourne"),
    ["2026-04-04T15:30:00.000Z", "2026-04-04T16:30:00.000Z"],
  );
  assert.deepEqual(dayBounds("2026-10-04T12:00:00Z", "Australia/Melbourne"), {
    start: "2026-10-03T14:00:00.000Z",
    end: "2026-10-04T13:00:00.000Z",
  });
});

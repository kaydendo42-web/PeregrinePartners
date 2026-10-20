import test from "node:test";
import assert from "node:assert/strict";
import { expandRange, parseTimeOff } from "../../lib/shop/timeoff.ts";

test("a range covers every day, ends included", () => {
  assert.equal(expandRange("2026-11-05", "2026-11-09").length, 5);
  assert.deepEqual(expandRange("2026-10-03", "2026-10-05"), ["2026-10-03", "2026-10-04", "2026-10-05"]); // across the clock change
  assert.deepEqual(expandRange("2026-12-25", "2026-12-25"), ["2026-12-25"]);
});

test("at most 60 days at once, and never backwards", () => {
  assert.throws(() => expandRange("2026-11-01", "2026-12-31"), /Pick 60 days or fewer\./);
  assert.throws(() => expandRange("2026-11-09", "2026-11-05"), /The last day can't be before the first\./);
});

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};

test("closed all day, or different hours", () => {
  assert.deepEqual(parseTimeOff(fd({ from: "2026-11-05", to: "2026-11-06", kind: "closed", note: "Away" })), {
    ok: true,
    dates: ["2026-11-05", "2026-11-06"],
    closed: true,
    open: null,
    close: null,
    note: "Away",
  });
  assert.deepEqual(parseTimeOff(fd({ from: "2026-12-24", to: "", kind: "hours", open: "10:00", close: "14:00", note: "" })), {
    ok: true,
    dates: ["2026-12-24"],
    closed: false,
    open: "10:00",
    close: "14:00",
    note: null,
  });
  assert.deepEqual(parseTimeOff(fd({ from: "2026-12-24", kind: "hours", open: "14:00", close: "10:00" })), {
    ok: false,
    error: "Closing time must be after opening.",
  });
});

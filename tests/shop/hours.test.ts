import test from "node:test";
import assert from "node:assert/strict";
import { parseHoursForm } from "../../lib/shop/hours.ts";

const form = (days: Record<number, [string, string] | null>) => {
  const fd = new FormData();
  for (const [d, h] of Object.entries(days)) {
    if (!h) continue;
    fd.set(`day-${d}-on`, "on");
    fd.set(`day-${d}-open`, h[0]);
    fd.set(`day-${d}-close`, h[1]);
  }
  return fd;
};

test("days switched on become hours; days off are left out", () => {
  assert.deepEqual(parseHoursForm(form({ 1: null, 2: ["10:00", "18:15"] })), {
    ok: true,
    days: [{ weekday: 2, open: "10:00", close: "18:15" }],
  });
});

test("closing before opening names the day", () => {
  assert.deepEqual(parseHoursForm(form({ 2: ["18:00", "10:00"] })), { ok: false, error: "Closing time must be after opening on Tuesday." });
});

test("times off the quarter hour are refused", () => {
  assert.equal(parseHoursForm(form({ 3: ["10:10", "18:00"] })).ok, false);
});

test("a whole week off is allowed (empty list)", () => {
  assert.deepEqual(parseHoursForm(new FormData()), { ok: true, days: [] });
});

import test from "node:test";
import assert from "node:assert/strict";
import { dayBounds, layoutDay, zonedTime } from "../../lib/shop/day.ts";
import type { ShopBlock, ShopBooking } from "../../lib/shop/types.ts";

const TZ = "Australia/Melbourne";
const at = (date: string, hhmm: string) => zonedTime(date, hhmm, TZ).toISOString();

const booking = (date: string, from: string, to: string, extra: Partial<ShopBooking> = {}): ShopBooking => ({
  id: `b-${from}`,
  serviceId: "s",
  serviceName: "Haircut",
  startsAt: at(date, from),
  endsAt: at(date, to),
  blockedUntil: at(date, to),
  status: "confirmed",
  priceCents: 5000,
  notes: null,
  source: "web",
  customer: { id: "c", name: "Kai", phone: "+61412345678", email: null },
  ...extra,
});

test("Melbourne wall-clock times become the right instants", () => {
  assert.equal(at("2026-10-20", "10:00"), "2026-10-19T23:00:00.000Z"); // AEDT, +11
  assert.equal(at("2026-07-14", "10:00"), "2026-07-14T00:00:00.000Z"); // AEST, +10
});

test("a day is midnight to midnight, 23 hours when the clocks go forward", () => {
  const { from, to } = dayBounds("2026-10-20", TZ);
  assert.equal(from.toISOString(), "2026-10-19T13:00:00.000Z");
  assert.equal(to.getTime() - from.getTime(), 24 * 3_600_000);
  const dst = dayBounds("2026-10-04", TZ);
  assert.equal(dst.to.getTime() - dst.from.getTime(), 23 * 3_600_000);
});

test("the timeline spans opening hours, rounded out to the hour", () => {
  const d = layoutDay([booking("2026-10-20", "10:00", "10:45")], [], ["10:00", "18:15"], TZ);
  assert.equal(d.startMin, 600);
  assert.equal(d.endMin, 1140);
  assert.equal(d.items[0].top, 0);
  assert.equal(d.items[0].height, 45);
  assert.equal(d.items[0].label, "10:00 Kai");
  assert.equal(d.items[0].sub, "Haircut");
});

test("an appointment outside hours stretches the timeline to show it", () => {
  const d = layoutDay([booking("2026-10-20", "20:00", "20:45", { source: "owner" })], [], ["10:00", "18:15"], TZ);
  assert.equal(d.endMin, 1260);
  assert.equal(d.items[0].top, 1200 - 600);
});

test("a closed, empty day shows 8am to 8pm", () => {
  const d = layoutDay([], [], null, TZ);
  assert.deepEqual([d.startMin, d.endMin, d.items.length], [480, 1200, 0]);
});

test("blocks sit on the timeline beside appointments", () => {
  const block: ShopBlock = { id: "k", startsAt: at("2026-10-20", "13:00"), endsAt: at("2026-10-20", "14:00"), reason: "Lunch" };
  const d = layoutDay([], [block], ["10:00", "18:15"], TZ);
  assert.deepEqual(d.items.map((i) => [i.kind, i.top, i.height, i.label]), [["block", 180, 60, "Lunch"]]);
});

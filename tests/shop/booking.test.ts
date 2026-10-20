import test from "node:test";
import assert from "node:assert/strict";
import { normalisePhone, planBlock, planBooking } from "../../lib/shop/booking.ts";
import { zonedTime } from "../../lib/shop/day.ts";
import type { ShopBlock, ShopBooking, ShopService } from "../../lib/shop/types.ts";

const TZ = "Australia/Melbourne";
const DAY = "2026-10-20";
const iso = (hhmm: string) => zonedTime(DAY, hhmm, TZ).toISOString();
const haircut: ShopService = { id: "s", name: "Haircut", durationMin: 45, priceCents: 5000, active: true, sort: 1 };
const existing = (from: string, to: string, status: ShopBooking["status"] = "confirmed"): ShopBooking => ({
  id: "b",
  serviceId: "s",
  serviceName: "Haircut",
  startsAt: iso(from),
  endsAt: iso(to),
  blockedUntil: iso(to),
  status,
  priceCents: 5000,
  notes: null,
  source: "web",
  customer: { id: "c", name: "Kai", phone: "+61412345678", email: null },
});
const block = (from: string, to: string): ShopBlock => ({ id: "k", startsAt: iso(from), endsAt: iso(to), reason: null });
const plan = (time: string, bookings: ShopBooking[] = [], blocks: ShopBlock[] = [], bufferMinutes = 0) =>
  planBooking({ service: haircut, date: DAY, time, tz: TZ, bufferMinutes }, bookings, blocks);

test("an appointment on top of another is refused", () => {
  assert.deepEqual(plan("10:00", [existing("10:00", "10:45")]), { ok: false, error: "That time is taken." });
});

test("an appointment in blocked time is refused", () => {
  assert.deepEqual(plan("10:00", [], [block("10:30", "11:00")]), { ok: false, error: "That's in blocked time." });
});

test("back to back is fine, and the end comes from the service length", () => {
  const p = plan("10:45", [existing("10:00", "10:45")]);
  assert.equal(p.ok, true);
  if (p.ok) {
    assert.equal(p.endsAt, iso("11:30"));
    assert.equal(p.blockedUntil, iso("11:30"));
  }
});

test("the owner can book outside the guest grid and outside hours", () => {
  assert.equal(plan("10:15").ok, true);
  assert.equal(plan("20:00").ok, true);
});

test("a cancelled booking doesn't hold its time", () => {
  assert.equal(plan("10:00", [existing("10:00", "10:45", "cancelled")]).ok, true);
});

test("the gap after an appointment is held too", () => {
  assert.deepEqual(plan("10:00", [existing("10:50", "11:35")], [], 15), { ok: false, error: "That time is taken." });
});

test("times must be on a quarter hour", () => {
  assert.deepEqual(plan("10:10"), { ok: false, error: "Pick a time on the quarter hour." });
});

test("a block can't be laid over an appointment", () => {
  assert.deepEqual(planBlock({ date: DAY, from: "10:30", to: "11:00", tz: TZ }, [existing("10:00", "10:45")]), {
    ok: false,
    error: "There's an appointment in that time.",
  });
  assert.deepEqual(planBlock({ date: DAY, from: "11:00", to: "10:00", tz: TZ }, []), { ok: false, error: "End after you start." });
  assert.equal(planBlock({ date: DAY, from: "13:00", to: "14:00", tz: TZ }, [existing("10:00", "10:45")]).ok, true);
});

test("Australian mobiles become +61", () => {
  assert.equal(normalisePhone("0412 345 678"), "+61412345678");
  assert.equal(normalisePhone("+61 412 345 678"), "+61412345678");
  assert.equal(normalisePhone("(03) 9555 1234"), "+61395551234");
  assert.equal(normalisePhone("0412 345"), null);
});

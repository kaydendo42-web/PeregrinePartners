import test from "node:test";
import assert from "node:assert/strict";
import { parseService, parseSettings } from "../../lib/shop/settings.ts";

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};
const good = { advance: "21", notice: "2", slots: "45", cutoff: "12", buffer: "0" };

test("booking rules read in Vance's units", () => {
  assert.deepEqual(parseSettings(fd(good)), {
    ok: true,
    value: { maxAdvanceDays: 21, minNoticeMinutes: 120, slotMinutes: 45, guestChangeCutoffHours: 12, bufferMinutes: 0 },
  });
});

test("each rule has its own range and its own message", () => {
  assert.deepEqual(parseSettings(fd({ ...good, advance: "0" })), { ok: false, error: "Pick between 1 and 180 days." });
  assert.deepEqual(parseSettings(fd({ ...good, slots: "20" })), { ok: false, error: "Slots run every 15, 30, 45 or 60 minutes." });
  assert.deepEqual(parseSettings(fd({ ...good, notice: "49" })), { ok: false, error: "Notice can be 0 to 48 hours." });
  assert.deepEqual(parseSettings(fd({ ...good, buffer: "75" })), { ok: false, error: "A gap can be 0 to 60 minutes." });
});

test("a service: name, length in quarter hours, price in dollars", () => {
  assert.deepEqual(parseService(fd({ name: " Skin fade ", duration: "45", price: "50" })), {
    ok: true,
    value: { name: "Skin fade", durationMin: 45, priceCents: 5000 },
  });
  assert.deepEqual(parseService(fd({ name: "Cut", duration: "45", price: "52.50" })), {
    ok: true,
    value: { name: "Cut", durationMin: 45, priceCents: 5250 },
  });
  assert.deepEqual(parseService(fd({ name: "Cut", duration: "50", price: "50" })), { ok: false, error: "Use steps of 15 minutes." });
  assert.deepEqual(parseService(fd({ name: "", duration: "45", price: "50" })), { ok: false, error: "Give the service a name." });
  assert.deepEqual(parseService(fd({ name: "Cut", duration: "45", price: "-1" })), { ok: false, error: "Price can't be negative." });
});

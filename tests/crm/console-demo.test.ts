import test from "node:test";
import assert from "node:assert/strict";
import { demoFloor, demoPlan, demoBookings } from "../../lib/console/demo.ts";

test("the isolated console demo reads the current schema's floor seed", () => {
  assert.equal(demoFloor().tables.length, 31);
  assert.equal(demoFloor().sections.length, 4);
  assert.ok(demoPlan()?.width);
  assert.ok(demoBookings().length > 0);
});

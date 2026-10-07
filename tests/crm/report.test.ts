import test from "node:test";
import assert from "node:assert/strict";
import { reportPeriod, reportRange } from "../../lib/booking/report.ts";
test("booking report periods use the venue's calendar across DST and UTC midnight", () => {
  assert.deepEqual(
    reportRange("2026-10-05T13:30:00Z", "Australia/Melbourne", 7),
    { from: "2026-09-30", to: "2026-10-06" },
  );
  assert.deepEqual(
    reportRange("2026-10-04T00:00:00Z", "Australia/Melbourne", 30),
    { from: "2026-09-05", to: "2026-10-04" },
  );
  assert.equal(reportPeriod("90"), 90);
  assert.equal(reportPeriod("invalid"), 30);
});

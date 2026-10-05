import test from "node:test";
import assert from "node:assert/strict";
import {
  liveState,
  reduceLiveState,
  createRefreshScheduler,
} from "../../lib/crm/live-state.ts";
test("Live is shown only after the authorized subscription is established", () => {
  assert.equal(liveState.connection, "connecting");
  assert.equal(
    reduceLiveState(liveState, { type: "SUBSCRIBED" }).connection,
    "live",
  );
  assert.equal(
    reduceLiveState(liveState, { type: "CHANNEL_ERROR" }).connection,
    "reconnecting",
  );
  assert.equal(
    reduceLiveState(liveState, { type: "OFFLINE" }).connection,
    "disconnected",
  );
});
test("revocation blocks private content and cannot be repaired by a late subscription callback", () => {
  const lost = reduceLiveState(liveState, { type: "SESSION_LOST" });
  assert.equal(lost.authorized, false);
  assert.equal(reduceLiveState(lost, { type: "SUBSCRIBED" }).authorized, false);
  assert.equal(
    reduceLiveState(lost, { type: "SUBSCRIBED" }).connection,
    "disconnected",
  );
});
test("event bursts cause one refresh and disposal cancels pending work", async () => {
  let count = 0;
  const scheduler = createRefreshScheduler(() => count++, 10);
  scheduler.schedule();
  scheduler.schedule();
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(count, 1);
  scheduler.schedule();
  scheduler.dispose();
  scheduler.schedule();
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(count, 1);
});

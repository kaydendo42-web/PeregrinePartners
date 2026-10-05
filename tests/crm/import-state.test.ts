import test from "node:test";
import assert from "node:assert/strict";
import { reduceImportState } from "../../lib/crm/import/controller.ts";
test("blocking previews cannot publish and wrong-batch completions are ignored", () => {
  const blocked = { kind: "preview" as const, batchId: "a", blockingErrors: 1 };
  assert.deepEqual(
    reduceImportState(blocked, { type: "PUBLISH", requestId: "r" }),
    blocked,
  );
  const ready = { ...blocked, blockingErrors: 0 };
  const publishing = reduceImportState(ready, {
    type: "PUBLISH",
    requestId: "r",
  });
  assert.equal(publishing.kind, "importing");
  const counts = {
    created: 1,
    linked: 0,
    duplicates: 0,
    skipped: 0,
    rejected: 0,
    total: 1,
  };
  assert.deepEqual(
    reduceImportState(publishing, { type: "COMMITTED", batchId: "b", counts }),
    publishing,
  );
  const completed = reduceImportState(publishing, {
    type: "COMMITTED",
    batchId: "a",
    counts,
  });
  assert.equal(completed.kind, "complete");
  assert.deepEqual(
    reduceImportState(completed, { type: "PUBLISH", requestId: "next" }),
    completed,
  );
});
test("network failures keep a checkpoint and cancellation needs server confirmation", () => {
  const importing = {
    kind: "importing" as const,
    batchId: "a",
    requestId: "r",
  };
  const failed = reduceImportState(importing, {
    type: "FAIL",
    message: "Offline",
  });
  assert.equal(failed.kind, "failed");
  assert.deepEqual(reduceImportState(failed, { type: "RESUME" }), importing);
  assert.deepEqual(
    reduceImportState(importing, {
      type: "CANCEL",
      batchId: "a",
      confirmed: false,
    }),
    importing,
  );
  assert.equal(
    reduceImportState(importing, {
      type: "CANCEL",
      batchId: "a",
      confirmed: true,
    }).kind,
    "cancelled",
  );
});

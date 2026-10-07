import test from "node:test";
import assert from "node:assert/strict";
import {
  retainDirtyRows,
  toggleSelection,
  selectionChanged,
  boardStages,
  boardPageHref,
  queueContactState,
} from "../../lib/crm/queues.ts";
import { parseQuery } from "../../lib/crm/validation.ts";

test("a dirty follow-up remains available after it leaves the server filter", () => {
  const edited = { id: "one", version: 1, instruction: "Call", state: "open" };
  const other = { id: "two", version: 1, instruction: "Email", state: "open" };
  assert.deepEqual(
    retainDirtyRows([edited, other], [other], new Set(["one"])),
    [other, edited],
  );
  assert.deepEqual(retainDirtyRows([edited, other], [other], new Set()), [
    other,
  ]);
  const completed = { ...edited, version: 2, state: "done" };
  assert.deepEqual(retainDirtyRows([edited], [completed], new Set(["one"])), [
    completed,
  ]);
});

test("bulk review retains selected versions and detects changes or removed rows", () => {
  const selected = toggleSelection([], { id: "one", version: 1 });
  assert.equal(selectionChanged(selected, [{ id: "one", version: 1 }]), false);
  assert.equal(selectionChanged(selected, [{ id: "one", version: 2 }]), true);
  assert.equal(selectionChanged(selected, []), true);
  assert.deepEqual(selected, [{ id: "one", version: 1 }]);
});

test("board stage restriction and independent column pages survive paging", () => {
  const query = parseQuery({ stage: "replied", view: "board" });
  assert.deepEqual(boardStages(query), ["replied"]);
  const href = boardPageHref(
    "/owner/outreach?view=board&p_new=3&p_contacted=2&q=Cafe",
    "replied",
    2,
  );
  const params = new URL(href, "https://example.test").searchParams;
  assert.equal(params.get("p_new"), "3");
  assert.equal(params.get("p_contacted"), "2");
  assert.equal(params.get("p_replied"), "2");
  assert.equal(params.get("q"), "Cafe");
});

test("active outreach queues exclude stopped records, with an explicit stopped view", () => {
  assert.equal(queueContactState(parseQuery({})), false);
  assert.equal(
    queueContactState(parseQuery({ owner: "unassigned", stage: "replied" })),
    false,
  );
  assert.equal(queueContactState(parseQuery({ stopped: "1" })), true);
});

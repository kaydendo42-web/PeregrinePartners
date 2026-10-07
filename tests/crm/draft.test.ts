import test from "node:test";
import assert from "node:assert/strict";
import {
  beginDraft,
  editDraft,
  receiveServerRecord,
  rebaseDraft,
} from "../../lib/crm/draft.ts";
test("live server updates preserve an unsaved edit and its opened version", () => {
  const opened = { id: "one", version: 1, name: "Old" };
  const draft = editDraft(beginDraft(opened), { name: "My edit" });
  const refreshed = receiveServerRecord(draft, {
    id: "one",
    version: 2,
    name: "Other owner",
  });
  assert.equal(refreshed.value.name, "My edit");
  assert.equal(refreshed.base.version, 1);
  assert.equal(refreshed.incoming?.name, "Other owner");
  assert.equal(rebaseDraft(refreshed).base.version, 2);
  assert.equal(rebaseDraft(refreshed).value.name, "My edit");
});
test("clean drafts accept saved data without creating a conflict", () => {
  const draft = receiveServerRecord(
    beginDraft({ id: "one", version: 1, name: "Old" }),
    { id: "one", version: 2, name: "New" },
  );
  assert.equal(draft.value.name, "New");
  assert.equal(draft.dirty, false);
});

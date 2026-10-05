import test from "node:test";
import assert from "node:assert/strict";
import { escapeLike, outreachAllowed } from "../../lib/crm/validation.ts";
test("search punctuation is literal and does not broaden a filter", () => {
  assert.equal(escapeLike("50%_\\,()"), "50\\%\\_\\\\,()");
  assert.equal(escapeLike("a,b(stage.eq.won)"), "a,b(stage.eq.won)");
});
test("opt-out allows notes and past replies while preventing outreach", () => {
  assert.equal(outreachAllowed(true, "outreach"), false);
  assert.equal(outreachAllowed(true, "follow_up"), false);
  assert.equal(outreachAllowed(true, "note"), true);
  assert.equal(outreachAllowed(true, "reply"), true);
  assert.equal(outreachAllowed(false, "outreach"), true);
});

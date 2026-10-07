import test from "node:test";
import assert from "node:assert/strict";
import {
  parseBusinessPatch,
  parseVersion,
  parseUuid,
  parseQuery,
} from "../../lib/crm/validation.ts";

test("patches cannot set workspace or actor and versions cannot overflow", () => {
  for (const patch of [
    { workspace_id: "other", name: "Business" },
    { created_by: "other" },
    { version: 1 },
    { name: "" },
    { name: "x".repeat(301) },
    { stage: "invented" },
    { tags: Array(21).fill("a") },
    { website: "javascript:alert(1)" },
    { do_not_contact: "false" },
  ])
    assert.throws(() => parseBusinessPatch(patch));
  for (const value of [
    0,
    -1,
    Number.MAX_SAFE_INTEGER + 1,
    1.1,
    "1e2",
    "",
    null,
  ])
    assert.throws(() => parseVersion(value));
  assert.equal(parseVersion("12"), 12);
  assert.deepEqual(
    parseBusinessPatch({
      name: "  Peacock  ",
      assigned_to: null,
      stage: "replied",
      tags: [" Food ", "Food"],
    }),
    { name: "Peacock", assigned_to: null, stage: "replied", tags: ["Food"] },
  );
  assert.throws(() => parseUuid("not-a-uuid"));
});

test("query pagination is bounded and unknown sort cannot reach the database", () => {
  assert.equal(parseQuery({ page: "2", q: " Peacock " }).page, 2);
  assert.equal(parseQuery({ q: " Peacock " }).q, "Peacock");
  assert.throws(() => parseQuery({ page: "-1" }));
  assert.throws(() => parseQuery({ sort: "drop table" }));
});

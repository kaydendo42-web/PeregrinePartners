import test from "node:test";
import assert from "node:assert/strict";
import { needsTwoStep } from "../../lib/auth/two-step.ts";

const none = { currentLevel: "aal1", nextLevel: "aal1" } as const;
const enrolled = { currentLevel: "aal1", nextLevel: "aal2" } as const;
const passed = { currentLevel: "aal2", nextLevel: "aal2" } as const;

test("a shop owner without two-step goes straight to their shop", () => {
  assert.equal(needsTwoStep("/console/shop/vbarbers", none, true), false);
  assert.equal(needsTwoStep("/console", none, true), false);
  assert.equal(needsTwoStep("/sign-in/password", none, true), false);
});

test("venues and the founder office always need two-step", () => {
  assert.equal(needsTwoStep("/console/the-peacock", none, true), true);
  assert.equal(needsTwoStep("/console/the-peacock", none, false), true);
  assert.equal(needsTwoStep("/owner", none, true), true);
});

test("someone who isn't a shop member needs two-step even on shop paths", () => {
  assert.equal(needsTwoStep("/console/shop/vbarbers", none, false), true);
  assert.equal(needsTwoStep("/console", none, false), true);
});

test("anyone who turned two-step on has to pass it", () => {
  assert.equal(needsTwoStep("/console/shop/vbarbers", enrolled, true), true);
  assert.equal(needsTwoStep("/console/shop/vbarbers", passed, true), false);
  assert.equal(needsTwoStep("/console/the-peacock", passed, false), false);
});

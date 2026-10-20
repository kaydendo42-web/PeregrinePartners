import test from "node:test";
import assert from "node:assert/strict";
import { safeShopPath } from "../../lib/shop/back.ts";

test("only paths inside the same shop are followed", () => {
  assert.equal(safeShopPath("vbarbers", "/console/shop/vbarbers/booking/abc"), "/console/shop/vbarbers/booking/abc");
  assert.equal(safeShopPath("vbarbers", "/console/shop/vbarbers?date=2026-10-21"), "/console/shop/vbarbers?date=2026-10-21");
});

test("anywhere else falls back to the shop's calendar", () => {
  for (const bad of ["https://evil.example", "//evil.example", "/console/shop/other", "/console/shop/vbarbersx", "/owner", "javascript:alert(1)", "/console/shop/vbarbers/../../owner"]) {
    assert.equal(safeShopPath("vbarbers", bad), "/console/shop/vbarbers", bad);
  }
});

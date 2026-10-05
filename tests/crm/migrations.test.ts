import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";

test("the combined bookings and CRM release has unique Supabase migration versions", () => {
  const files = readdirSync(
    new URL("../../supabase/migrations/", import.meta.url),
  ).filter((n) => n.endsWith(".sql"));
  const versions = files.map((n) => n.split("_")[0]);
  assert.equal(
    new Set(versions).size,
    files.length,
    "Every Supabase migration must have its own version",
  );
});

import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";

test("each database migration chain has unique versions and client setup excludes founder migrations", () => {
  for (const directory of [
    "supabase/migrations/",
    "internal-db/supabase/migrations/",
    "supabase/legacy-owner/migrations/",
  ]) {
    const files = readdirSync(
      new URL("../../" + directory, import.meta.url),
    ).filter((n) => n.endsWith(".sql"));
    assert.ok(files.length, directory);
    assert.equal(
      new Set(files.map((n) => n.split("_")[0])).size,
      files.length,
      directory,
    );
    if (directory === "supabase/migrations/")
      assert.equal(
        files.some((n) =>
          /owner_crm|crm_mutations|crm_import|crm_commercial|rename_peregrine_office/.test(
            n,
          ),
        ),
        false,
      );
  }
});

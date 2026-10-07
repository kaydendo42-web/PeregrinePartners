import { readFile, readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const engine = process.env.CRM_TEST_ENGINE;
if (!engine)
  throw new Error("Set CRM_TEST_ENGINE to the disposable PGlite engine.");
const { PGlite } = await import(pathToFileURL(engine).href);
const db = new PGlite();
try {
  await db.exec(`create role anon; create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
    grant usage on schema auth to anon,authenticated;
    create publication supabase_realtime;`);
  for (const name of (
    await readdir(new URL("../supabase/migrations/", import.meta.url))
  )
    .filter((n) => n.endsWith(".sql"))
    .sort()) {
    await db.exec(
      await readFile(
        new URL("../supabase/migrations/" + name, import.meta.url),
        "utf8",
      ),
    );
    console.log("Internal migration passed:", name);
  }
  for (const name of [
    "owner_crm",
    "mutations",
    "commercial",
    "import",
    "import_review",
    "import_large",
  ]) {
    await db.exec(
      await readFile(
        new URL("../../supabase/tests/" + name + ".sql", import.meta.url),
        "utf8",
      ),
    );
    console.log("Internal rollback checks passed:", name);
  }
  await db.exec(
    await readFile(new URL("./connections.sql", import.meta.url), "utf8"),
  );
  console.log("Internal booking connection isolation passed.");
} catch (error) {
  console.error(error.message, error.detail ?? "", error.where ?? "");
  process.exitCode = 1;
} finally {
  await db.close();
}

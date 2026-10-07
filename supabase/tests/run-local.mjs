import { readFile, readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";

// Install a disposable test engine outside the app. Never connects to Supabase.
const modulePath = process.env.CRM_TEST_ENGINE;
if (!modulePath)
  throw new Error(
    "Set CRM_TEST_ENGINE to the PGlite dist/index.js absolute path.",
  );
const { PGlite } = await import(pathToFileURL(modulePath).href);
const db = new PGlite();
try {
  await db.exec(`create role anon; create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
    grant usage on schema auth to anon, authenticated;
    create table public.venues(id uuid primary key,name text default 'Test venue',slug text,timezone text default 'Australia/Melbourne');
    create table public.venue_members(venue_id uuid,user_id uuid);
    create table public.bookings(id text primary key,venue_id uuid references public.venues(id),guest_name text,email text default '',phone text default '',starts_at timestamptz,party_size integer,status text,source text,created_at timestamptz default now(),updated_at timestamptz default now());
    create function public.is_member(v uuid) returns boolean language sql stable security definer set search_path=pg_catalog,public as $$ select exists(select 1 from public.venue_members where venue_id=v and user_id=auth.uid()); $$;
    alter table public.venues enable row level security;
    alter table public.bookings enable row level security;
    create policy venue_read on public.venues for select to authenticated using(public.is_member(id) and auth.jwt()->>'aal'='aal2');
    create policy booking_read on public.bookings for select to authenticated using(public.is_member(venue_id) and auth.jwt()->>'aal'='aal2');
    grant select on public.venues,public.bookings to authenticated;
    create publication supabase_realtime;`);
  const migrations = [
    ...(await readdir(new URL("../migrations/", import.meta.url)))
      .filter((n) => n.endsWith("_client_crm_reporting.sql"))
      .map((n) => ({ name: n, path: "../migrations/" })),
    ...(await readdir(new URL("../legacy-owner/migrations/", import.meta.url)))
      .filter((n) => n.endsWith(".sql"))
      .map((n) => ({ name: n, path: "../legacy-owner/migrations/" })),
  ].sort((a, b) => a.name.localeCompare(b.name));
  if (!migrations.length) throw new Error("No CRM migrations exist yet.");
  for (const { name, path } of migrations) {
    await db.exec(
      await readFile(new URL(path + name, import.meta.url), "utf8"),
    );
    console.log("Migration passed:", name);
  }
  const cases = (await readdir(new URL("./", import.meta.url)))
    .filter(
      (n) => n.endsWith(".sql") && (!process.argv[2] || n === process.argv[2]),
    )
    .sort();
  if (!cases.length) throw new Error("Unknown SQL test file.");
  for (const name of cases) {
    const results = await db.exec(
      await readFile(new URL(name, import.meta.url), "utf8"),
    );
    for (const result of results)
      for (const row of result.rows ?? [])
        if (row.verification) console.log(JSON.stringify(row.verification));
    console.log("Rollback checks passed:", name);
  }
  if (!process.argv[2]) {
    await db.exec(
      await readFile(
        new URL("../operations/retire-internal-crm.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.exec(`do $$ begin
      if to_regclass('public.crm_businesses') is not null or to_regclass('public.crm_workspaces') is not null then raise exception 'Internal retirement incomplete'; end if;
      if to_regclass('public.bookings') is null or to_regclass('public.client_crm_entries') is null or to_regclass('public.venue_members') is null then raise exception 'Client tables changed'; end if;
      if to_regprocedure('public.booking_dashboard(uuid,date,date)') is null or to_regprocedure('public.client_crm_customers(uuid,text,integer)') is null then raise exception 'Client reporting changed'; end if;
      if public.crm_owner_status() then raise exception 'Legacy owner routing remained active'; end if;
    end $$;`);
    console.log("Source retirement preserves client tables and reporting.");
  }
} catch (error) {
  console.error(error.message, error.detail ?? "", error.where ?? "");
  process.exitCode = 1;
} finally {
  await db.close();
}

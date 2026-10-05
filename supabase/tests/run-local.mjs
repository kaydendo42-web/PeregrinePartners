import { readFile, readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// Install a disposable test engine outside the app. Never connects to Supabase.
const modulePath = process.env.CRM_TEST_ENGINE;
if (!modulePath) throw new Error('Set CRM_TEST_ENGINE to the PGlite dist/index.js absolute path.');
const { PGlite } = await import(pathToFileURL(modulePath).href);
const db = new PGlite();
try {
  await db.exec(`create role anon; create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
    grant usage on schema auth to anon, authenticated;
    create table public.venues(id uuid primary key);
    create table public.venue_members(venue_id uuid,user_id uuid);
    create publication supabase_realtime;`);
  const migrations = (await readdir(new URL('../migrations/',import.meta.url))).filter(n=>n.startsWith('20261007')).sort();
  if (!migrations.length) throw new Error('No CRM migrations exist yet.');
  for (const name of migrations) {
    await db.exec(await readFile(new URL('../migrations/'+name,import.meta.url),'utf8'));
    console.log('Migration passed:', name);
  }
  for (const name of (await readdir(new URL('./',import.meta.url))).filter(n=>n.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(name,import.meta.url),'utf8'));
    console.log('Rollback checks passed:', name);
  }
} catch(error) {
  console.error(error.message, error.detail ?? '', error.where ?? '');
  process.exitCode=1;
} finally { await db.close(); }

# Owner Dashboard and Outreach CRM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Peregrine's three owners a HighLevel-style dashboard with private client/tool records and a shared, live outreach CRM populated from CSV.

**Architecture:** Extend the existing Next.js app and signed-in Supabase clients. A workspace-scoped CRM core owns businesses, contacts, activities, follow-ups, imports, and conflict handling; the owner shell adds Peregrine's client relationships, tools, and manual billing. Database policies and transactional RPCs enforce access and consistency; Realtime invalidates visible server data without discarding drafts.

**Tech Stack:** Next.js 16.3.2 App Router, React 19.2.8, TypeScript, existing CSS/Tailwind 4, Supabase SSR 0.12.7 and JS 2.117.2, PostgreSQL, Supabase Realtime, Node.js 24.15.0 native tests; `csv-parse` 6 browser ESM for CSV parsing.

**Spec:** [Approved design](../specs/2026-10-05-owner-dashboard-outreach-design.md).

## Global Constraints

- Work on `codex/owner-dashboard-outreach` in the existing checkout; preserve local changes in `CLAUDE.md`, `docs/research/og/shoot.mjs`, and `public/og.png`.
- Read applicable `AGENTS.md` and installed Next.js docs before code changes. Use Node.js runtime; no framework upgrade, marketing-page redesign, or booking-console refactor.
- Each owner has their own login. A venue member with role `owner` is a client owner, not a Peregrine platform owner.
- The internal workspace requires active platform-owner membership and a two-step (`aal2`) session. No anonymous read/write is allowed.
- Every child relationship enforces matching workspace IDs in the database. Assigned users must be active members of that workspace.
- Use the signed-in Supabase client, never a browser service-role key. Owner data must never enter the existing console demo mode.
- Client CRM access is a later release. Deliver its reusable data boundaries now; expose only the internal owner workspace.
- Replies and billing are recorded manually in this release. No automatic email/SMS sending, inbox connection, payment charging, or tool provisioning.
- Initial limits: 10 MiB and 5,000 rows per file; staging chunks of at most 100 rows and 256 KiB. Server-side validation is mandatory.
- CSV files and real prospect data must not be committed to this public GitHub repository. No automatic website fetching or enrichment.
- Stages: New, Contacted, Replied, Meeting booked, Proposal sent, Won, and Lost. Do not contact is a separate flag.
- All dates display in the workspace timezone, initially Australia/Melbourne, and store as UTC timestamps.
- Tables use server-side filtering and pagination (50 records per page). Board columns paginate independently and show their total counts.
- Target visibility within five seconds on a healthy connection; measure it rather than assume it. While disconnected, poll every 30 seconds and state that updates may be delayed.
- The owner emails, actual CSV, and live Supabase connection are outstanding setup inputs. Complete unaffected work; never claim live permission, import, or collaboration checks passed without them.

## Review Focus

1. Default versus explicit sign-in destinations: founders land in their workspace, clients retain console routing, and malformed/external destinations are rejected. Tests: Tasks 1–2.
2. Shared-domain businesses, repeated headers, multiline CSV, and leading-zero phones: preview retains every column and flags possible duplicates without merging branches. Tests: Tasks 5–6.
3. Simultaneous imports and retries after connection loss: counts reconcile, staging stays invisible, and one committed import cannot be published twice. Tests: Task 6.
4. Active drafts during another owner's save or session expiry: draft contents survive refresh/conflict, expired access stops private reads/writes, and notes retain correct authors. Tests: Tasks 3 and 7.
5. Melbourne midnight/DST and mixed-currency balances: follow-ups keep their intended time, overdue status uses workspace dates, and currencies are never combined. Tests: Task 4.

## File and data boundaries

| Path | Responsibility |
| --- | --- |
| `lib/auth/next.ts` | Shared safe destination parsing and default owner/client destination. |
| `lib/owner/access.ts` | Server-only authenticated owner check and internal workspace context. |
| `lib/crm/types.ts`, `validation.ts`, `time.ts`, `money.ts`, `draft.ts`, `live-state.ts` | Reusable contracts, bounded inputs, dates, money, draft and connection reducers. |
| `lib/crm/query.ts`, `mutations.ts` | Workspace-scoped reads and typed RPC result translation. |
| `lib/crm/import/{csv,mapping,normalize,duplicates,chunks}.ts` | Browser-safe import parsing and pure transformations. |
| `components/crm/{business-form,filters,table,board,activity-form,timeline,follow-up-form}.tsx` | Reusable CRM controls that receive workspace context and actions. |
| `components/crm/import/{import-wizard,mapping,preview,progress}.tsx` | The reviewed, resumable CSV import flow. |
| `components/crm/{draft-state,live-refresh}.tsx` | Persistent in-memory drafts and authenticated change subscription. |
| `app/owner/{layout,page,nav,loading,error}.tsx`, `app/owner/owner.css` | Owner dashboard shell, overview, loading, and recovery. |
| `app/owner/outreach/page.tsx`, `app/owner/outreach/actions.ts`, `app/owner/outreach/[business]/page.tsx`, `app/owner/outreach/import/page.tsx` | Prospect list/detail/import routes. |
| `app/owner/clients/page.tsx`, `app/owner/clients/actions.ts`, `app/owner/clients/[client]/page.tsx`, `app/owner/clients/{client-form,client-tools,billing-form}.tsx` | Client registry and commercial records. |
| `app/owner/{follow-ups,tools}/page.tsx`, `tools/actions.ts`, `tools/tool-form.tsx` | Follow-up work list and editable tool catalogue. |
| `lib/owner/overview.ts`, `clients.ts`, `tools.ts`, `billing.ts` | Platform-only aggregates and commercial data reads. |
| `supabase/migrations/20261007000000_owner_crm.sql` | Schema, indexed access helpers, RLS, read grants, and bootstrap workspace. |
| `supabase/migrations/20261007001000_crm_mutations.sql` | Transactional mutations, attribution, conflict checks, conversion, billing. |
| `supabase/migrations/20261007002000_crm_import.sql` | Staging, duplicate decisions, retry-safe atomic publishing. |
| `supabase/migrations/20261007003000_crm_realtime.sql` | Publication of authorised insert/update events. |
| `tests/crm/*.test.ts`, `supabase/tests/owner_crm.sql`, `docs/owner-dashboard-setup.md` | Domain regression checks, rollback-only database checks, and verified setup. |

Use the `crm_` prefix for new data tables, except `platform_owners`. Existing
tables and migrations remain unchanged. Every editable row has `version bigint`,
`created_at`, `updated_at`, and database-set `created_by`/`updated_by` user IDs.

| Table | Required columns beyond ID/audit columns |
| --- | --- |
| `platform_owners` | `user_id` primary key, `active`; references `auth.users`. |
| `crm_workspaces` | unique `slug`, `name`, `kind` (`internal`/`client`), `timezone`. Seed slug `peregrine`; do not seed owner emails. |
| `crm_workspace_members` | `(workspace_id,user_id)` primary key, `display_name`, `active`; trusted setup only. |
| `crm_businesses` | `workspace_id`, `origin` (`outreach`/`client`), `name`, `location`, `industry`, `website`, `stage`, `assigned_to`, `priority`, `tags`, `do_not_contact`, `archived`, `source_fields jsonb`, nullable `import_batch_id`, `source_row`. |
| `crm_contacts` | `workspace_id`, `business_id`, `name`, `email`, `phone`, `is_primary`, `source_fields jsonb`; invalid optional values remain only in source fields. |
| `crm_activities` | `workspace_id`, nullable `business_id` for workspace-wide import/catalogue events, `kind`, `channel`, `occurred_at`, `summary`, `changes jsonb`, `actor_id`, `request_id`; append-only. |
| `crm_follow_ups` | `workspace_id`, `business_id`, `assigned_to`, `due_at`, `instruction`, `state` (`open`/`done`/`cancelled`). |
| `crm_clients` | `workspace_id`, unique `(workspace_id,business_id)`, nullable `venue_id`, `relationship_owner`, `status` (`active`/`paused`/`closed`). |
| `crm_tool_catalog` | `workspace_id`, unique `(workspace_id,slug)`, `name`, `availability` (`available`/`planned`), `archived`. |
| `crm_client_tools` | `workspace_id`, `client_id`, `tool_id`, `status` (`active`/`paused`/`cancelled`), nullable `amount_minor`, `currency`, `cadence` (`monthly`/`annual`/`one_off`), `starts_on`, nullable `ends_on`. |
| `crm_billing_records` | `workspace_id`, `client_id`, `reference`, `amount_minor`, `paid_minor`, `currency`, `due_on`, nullable `settled_at`; status is derived from balance. |
| `crm_import_batches` | `workspace_id`, nullable server `fingerprint` with unique committed `(workspace_id,fingerprint)`, advisory `source_digest`, `filename`, `byte_count`, `row_count`, `columns jsonb`, `mapping jsonb`, `state` (`staging`/`ready`/`committed`/`reused`/`cancelled`), nullable scoped `duplicate_of`, `counts jsonb`. |
| `crm_import_rows` | `(workspace_id,batch_id,row_number)` primary key, `source jsonb`, `normalized jsonb`, `decision` (`import`/`skip`/`link_contact`), nullable `target_business_id`/`target_contact_id`, `row_fingerprint`, `issues jsonb`, nullable `published_at`, `outcome`; unique accepted `(workspace_id,row_fingerprint)` where `published_at is not null`. |
| `crm_mutation_requests` | `(workspace_id,actor_id,request_id)` primary key, operation, payload digest, committed `result jsonb`; written only inside checked mutation transactions. |

Contacts, prospect/client activities, and follow-ups attach to a business. A client
account references that same business, so conversion retains one contact/history
record. Directly created clients have business `origin=client` and are excluded
from outreach metrics; converted prospects retain `origin=outreach` and Won.

## Task 1: Establish domain contracts and protected database storage

**Files:** Create `lib/crm/types.ts`, `lib/crm/validation.ts`, `lib/auth/next.ts`, `tests/crm/access.test.ts`, `tests/crm/validation.test.ts`, `supabase/migrations/20261007000000_owner_crm.sql`, `supabase/tests/owner_crm.sql`. Modify `package.json`, `tsconfig.json`, `.gitignore`.

**Interfaces:** Produce `UUID = string`, `Stage`, `Priority`, `Business`, `Contact`, `Activity`, `FollowUp`, `ClientAccount`, `ClientTool`, `BillingRecord`, `OwnerContext`, `PageResult<T>`, and `MutationResult<T>` in `types.ts`. `OwnerContext` contains `{userId, workspaceId, timezone, displayName}`. `Business` includes all business-table columns plus nullable last-contact/next-follow-up and updater display names. `PageResult<T>` is `{rows:T[],total:number,page:number,pageSize:50}`. Mutation results are `{ok:true,value:T}` or `{ok:false,kind:'validation'|'conflict'|'forbidden'|'unavailable',message:string,current?:T}`.

Use exact database stage values `new`, `contacted`, `replied`, `meeting_booked`,
`proposal_sent`, `won`, `lost`, with the spec's human labels at the UI boundary.
Priority values are `low`, `normal`, `high`. Timestamp fields are ISO strings,
nullable fields remain null, and safe bigint row versions are decoded as numbers
only after the safe-integer check. Keep snake_case for database record fields;
OwnerContext and form input objects use the explicitly declared camelCase fields.

- [x] **Step 1: Pin destination and input behavior with failing native tests.** Set script `test` to `node --experimental-strip-types --test tests/crm/*.test.ts`; enable `allowImportingTsExtensions` with the existing `noEmit` setting. Pure modules import each other with explicit `.ts` extensions; they do not import Next.js or server-only modules.

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { safeDestination, defaultDestination } from '../../lib/auth/next.ts';
test('only internal owner/console roots are accepted', () => {
  assert.equal(safeDestination('/owner/outreach?page=2'), '/owner/outreach?page=2');
  assert.equal(safeDestination('//outside.example'), null);
  assert.equal(safeDestination('/ownerish'), null);
  assert.equal(safeDestination('/consoleevil'), null);
  assert.equal(safeDestination('/owner/../sign-in'), null);
  assert.equal(safeDestination('/owner/%5cevil'), null);
  assert.equal(defaultDestination(null, true), '/owner');
  assert.equal(defaultDestination(null, false), '/console');
  assert.equal(defaultDestination('/console/the-peacock', true), '/console/the-peacock');
});
```

Run `npm test`; this test must fail before the new module exists.

- [x] **Step 2: Implement the shared destination functions and bounded domain types.** Keep parsing independent of cookies/auth. The destination chooses navigation, not permission.

```ts
export function safeDestination(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020\u007f]/u.test(value)) return null;
  try {
    const url = new URL(value, 'https://peregrine.invalid');
    const path = decodeURIComponent(url.pathname);
    if (url.origin !== 'https://peregrine.invalid' || /[\\\u0000-\u0020\u007f]/u.test(path)) return null;
    return ['/owner', '/console'].some(root => path === root || path.startsWith(root + '/')) ? url.pathname + url.search : null;
  } catch { return null; }
}
export function defaultDestination(requested: unknown, owner: boolean): string {
  return safeDestination(requested) ?? (owner ? '/owner' : '/console');
}
```

`validation.ts` exports `parseUuid(value:unknown):UUID`, `parseVersion(value:unknown):number`, `parseStage(value:unknown):Stage`, `parseBusinessPatch(value:unknown):BusinessPatch`, and `parseQuery(value:unknown):BusinessQuery`. A patch permits only name/location/industry/website/stage/assigned_to/priority/tags/do_not_contact/archived. Reject unexpected keys rather than accepting workspace/actor/version fields. Require safe positive integer versions, 300-character names, 2,000-character URLs, 10,000-character note/instruction text, at most 20 tags of 80 characters, and bounded JSON of 128 KiB per source row. Preserve longer imported values in the flagged source preview rather than silently truncate.

```ts
import { parseBusinessPatch, parseVersion } from '../../lib/crm/validation.ts';
test('untrusted patches cannot set permissions or bypass conflicts', () => {
  assert.throws(() => parseBusinessPatch({workspace_id:'other',name:'Business'}));
  assert.throws(() => parseBusinessPatch({created_by:'other'}));
  assert.throws(() => parseVersion(Number.MAX_SAFE_INTEGER + 1));
  assert.throws(() => parseVersion(0));
});
```

- [x] **Step 3: Create the schema described in the table above.** Use `unique(workspace_id,id)` on parent tables and composite foreign keys for every scoped child. `assigned_to` and relationship owner reference `(workspace_id,user_id)` in members; functions additionally check `active`. Enforce stages, priority, lengths, nonnegative safe minor-unit amounts, `paid_minor <= amount_minor`, source JSON sizes, start/end ordering, and at most one active primary contact per business. Use UUIDs, not imported names, as IDs. Index workspace with stage/assignment/due-date/archive, batch/source row, and business/time for the timeline.

Implement `crm_owner_status() returns boolean` (signed-in user's own active platform membership only, permitted before MFA for routing) and `crm_can_access(p_workspace uuid) returns boolean`. Only the second requires `aal2`, an internal workspace, and active membership in both owner and workspace tables. Both are stable security-definer functions with fixed `search_path` and fully qualified tables; revoke PUBLIC/anon execute. The membership policies must avoid recursive self-queries.

```sql
create function public.crm_can_access(p_workspace uuid) returns boolean
language sql stable security definer set search_path = pg_catalog, public as $$
  select (select auth.jwt()->>'aal') = 'aal2'
    and exists (select 1 from public.platform_owners o where o.user_id=(select auth.uid()) and o.active)
    and exists (select 1 from public.crm_workspace_members m
      join public.crm_workspaces w on w.id=m.workspace_id
      where m.workspace_id=p_workspace and m.user_id=(select auth.uid())
        and m.active and w.kind='internal');
$$;
revoke all on function public.crm_can_access(uuid) from public, anon;
grant execute on function public.crm_can_access(uuid) to authenticated;
```

Enable RLS on every table. Grant authenticated SELECT only on scoped CRM rows, guarded by `crm_can_access(workspace_id)`; no direct INSERT/UPDATE/DELETE grants. Treat workspaces using their `id`, platform owners with self-read/authorised owner-directory policies, and workspace members with scoped reads. Future client-kind workspaces remain denied. Writes will use explicitly checked RPCs in subsequent tasks; no public functions can bypass them.

- [x] **Step 4: Write rollback-only database checks before accepting the migration.** Use a transaction with deterministic synthetic fixture users, two internal test workspaces, active owner/membership rows, and one business per workspace. Restore role between fixture setup and assertions. Never persist test users in production. Switch JWT claims and SQL role to exercise genuine RLS.

```sql
-- In supabase/tests/owner_crm.sql, after fixture inserts under trusted role:
set local role authenticated;
select set_config('request.jwt.claims',
 '{"sub":"00000000-0000-4000-8000-000000000011","role":"authenticated","aal":"aal1"}', true);
do $$ begin
  if exists(select 1 from public.crm_businesses) then
    raise exception 'aal1 session saw CRM rows';
  end if;
end $$;
-- Repeat with fixture client-owner aal2: expect zero rows.
-- Repeat with fixture founder aal2: expect only their workspace's fixture row.
-- The script ends with ROLLBACK, including all auth.users fixture inserts.
```

Add explicit assertions for anon reads, membership self-grant attempts, a cross-workspace contact reference, inactive assignment, and spoofed actor fields. These are executable SQL assertions, not text-only checklist entries. Run in an available disposable/local database or through the connected project's trusted SQL interface inside the rollback transaction. If no database is available, report these checks pending rather than passed.

- [x] **Step 5: Run native tests, `npx tsc --noEmit`, and migration/SQL checks when available.** Add `/private-data/` and `/docs/owner-dashboard-captures/` to `.gitignore`; put synthetic fixtures under tests, real CSVs only in ignored private storage. Commit only these files: `feat: establish protected owner CRM storage`.

## Task 2: Add owner authentication routing and the HighLevel-style shell

**Files:** Create `lib/owner/access.ts`, `app/owner/layout.tsx`, `app/owner/nav.tsx`, `app/owner/owner.css`, `app/owner/loading.tsx`, `app/owner/error.tsx`, `app/owner/page.tsx`. Modify `proxy.ts`, `app/sign-in/actions.ts`, `app/sign-in/verify/page.tsx`, `app/auth/confirm/route.ts`, `components/forms/sign-in-form.tsx`, `app/console/page.tsx`. Test `tests/crm/access.test.ts` plus browser acceptance.

**Interfaces:** Consume `safeDestination` and `defaultDestination` from Task 1. Produce `requireOwner():Promise<{client:SupabaseClient,context:OwnerContext}>`; it returns the internal `peregrine` workspace only. Every subsequent owner query/action calls it. Produce `ownerSignedIn():Promise<boolean>` only for `/console` default routing; it must not suppress RPC/database errors.

- [x] **Step 1: Extend destination tests for invalid URI encoding, control characters, explicit owner routes for non-owners, and explicitly requested venue routes for founders.** An explicit owner destination for a client is safe as a URL but is forbidden by `requireOwner`/RLS; test both boundaries. Verify the unchanged existing sign-in path before edits.

```ts
test('destination selection never accepts malformed input', () => {
  assert.equal(safeDestination('/owner/%zz'),null);
  assert.equal(safeDestination('/console/\nvenue'),null);
  assert.equal(defaultDestination('/owner/outreach',false),'/owner/outreach');
  assert.equal(defaultDestination('/console/the-peacock/calendar',true),'/console/the-peacock/calendar');
});
```

- [x] **Step 2: Implement `requireOwner` at the data boundary.** Use `connection()`, `supabaseEnv()`, `supabase()`, `auth.getUser()`, and `getAuthenticatorAssuranceLevel()` from the existing implementation. Redirect unauthenticated requests to sign-in and `aal1` to verification. Check `crm_owner_status` then read the internal workspace and current membership through the signed-in client. A non-owner gets a denied/404 response; missing migration/workspace or failed query gets an honest setup/error state. No demo branch, service-role client, or silent catch.

```ts
const { data: { user }, error: userError } = await client.auth.getUser();
if (userError || !user) redirect('/sign-in?next=%2Fowner');
const { data: assurance, error: assuranceError } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
if (assuranceError) throw new Error('Could not verify sign-in.');
if (assurance?.currentLevel !== 'aal2') redirect('/sign-in/verify?next=%2Fowner');
const { data: isOwner, error: membershipError } = await client.rpc('crm_owner_status');
if (membershipError) throw new Error('Could not verify workspace access.');
if (!isOwner) notFound();
```

- [x] **Step 3: Update all existing destination consumers together.** `SignInForm` submits an empty next field when navigation was not explicitly requested. Password/link actions preserve a safe explicit destination through MFA. Verification chooses the default after aal2; the email confirmation route exchanges the token then sends the user through the same MFA/default routing. The proxy checks `/owner` as well as `/console`, matches exact path boundaries, refreshes cookies, and preserves a validated local destination. `/console` sends an owner to `/owner` on default entry; an explicit `/console/[venue]` remains usable according to existing venue membership. Retain the existing no-account-creation email-link behavior.

```ts
const protectedPath = ['/owner', '/console'].some(root =>
  request.nextUrl.pathname === root || request.nextUrl.pathname.startsWith(root + '/'));
// Existing signed-in and aal2 checks run when protectedPath is true.
// Matchers include '/owner/:path*', '/console/:path*', '/sign-in/:path*', '/auth/:path*'.
```

- [x] **Step 4: Build the shell with the selected reference.** Scoped `.owner-*` CSS: charcoal sidebar, light main surface, compact restrained cards, table/report region, accessible mobile menu. Navigation: Overview, Clients, Outreach, Follow-ups, Tools; correct `aria-current`. Reuse sign-out. Add owner title/noindex metadata, meaningful skeletons, retryable error boundary, and a clear protected empty overview. Use server page composition; a client nav/menu holds only navigation state.

```tsx
export default async function OwnerLayout({children}:{children:React.ReactNode}) {
  const {context} = await requireOwner();
  return <div className="owner-shell">
    <aside className="owner-sidebar"><OwnerNav /></aside>
    <main className="owner-main">
      <header className="owner-header">Peregrine workspace · {context.displayName}</header>
      {children}
    </main>
  </div>;
}
```

- [ ] **Step 5: Run tests/typecheck/build and exercise unauthenticated, founder aal1, founder aal2, and Jenny/client aal2 navigation.** Confirm direct owner action/data access is denied separately from the layout, and booking routes still work. Capture desktop/mobile shell screenshots without actual prospect data. Commit: `feat: add the owner workspace and sign-in routing`.

## Task 3: Deliver working shared outreach records and follow-ups

**Files:** Create `lib/crm/query.ts`, `lib/crm/mutations.ts`, `supabase/migrations/20261007001000_crm_mutations.sql`, all `components/crm` controls except import/live components, `app/owner/outreach/page.tsx`, `app/owner/outreach/actions.ts`, `app/owner/outreach/[business]/page.tsx`, `app/owner/follow-ups/page.tsx`, `tests/crm/outreach.test.ts`. Extend `supabase/tests/owner_crm.sql` and owner styles.

**Interfaces:** `BusinessQuery` is `{q?:string,stage?:Stage,owner?:UUID|'unassigned',location?:string,industry?:string,tag?:string,priority?:Priority,batch?:UUID,shortcut?:'mine'|'unassigned'|'replies'|'due'|'incomplete',sort:'name'|'last_contact'|'next_follow_up'|'updated',page:number,view:'table'|'board'}`. Query exports: `listBusinesses(context,query):Promise<PageResult<Business>>`, `getBusiness(context,id):Promise<{business:Business,contacts:Contact[],activities:Activity[],followUps:FollowUp[]}>`, `listFollowUps(context,filter):Promise<PageResult<FollowUp>>`, `listMembers(context):Promise<{userId:UUID,displayName:string}[]>`. Database RPCs: `crm_create_business(p_workspace,p_input,p_request_id)`, `crm_update_business(p_workspace,p_id,p_expected_version,p_patch,p_request_id)`, `crm_add_activity(p_workspace,p_business,p_input,p_request_id)`, `crm_save_follow_up(p_workspace,p_input,p_expected_version,p_request_id)`, `crm_bulk_businesses(p_workspace,p_items,p_patch,p_request_id)`. Mutations return typed `MutationResult` with the current record on conflict.

- [ ] **Step 1: Write behavioral domain and database tests.** Domain tests pin the patch allowlist, filter escaping, independent note request IDs, and do-not-contact behavior. Database tests attempt two saves with the same version, cross-workspace references, inactive assignment, unauthorised direct RPC calls, repeated activity request IDs, and contact suppression.

```sql
-- As the authenticated founder fixture, after creating the fixture business:
select public.crm_update_business(:'workspace', :'business', 1,
 '{"stage":"contacted"}', '00000000-0000-4000-8000-000000000101');
-- Calling again with expected version 1 and a different request ID must return
-- kind=conflict, not change stage, and not append a successful-change activity.
select public.crm_update_business(:'workspace', :'business', 1,
 '{"stage":"replied"}', '00000000-0000-4000-8000-000000000102');
```

Replace these script variables with the actual synthetic fixture UUIDs in the
checked-in SQL test, so the connector can run it without a shell variable layer.

- [x] **Step 2: Implement transactional mutation RPCs.** Use fixed-search-path security-definer functions because callers have no direct write grants. Each function begins with `crm_can_access`, looks up targets under both workspace and ID, validates input keys/types/lengths, and checks active assignments. Revoke PUBLIC/anon execute and grant only authenticated. Set actor from `auth.uid()`, not submitted data. Serialize per-record changes, compare expected version, update version once, and append one structured activity in the same transaction. `request_id` idempotency checks are scoped to actor/workspace and reject reuse with a different payload.

```sql
-- Core optimistic concurrency section inside crm_update_business:
if not public.crm_can_access(p_workspace) then
  raise exception 'Forbidden' using errcode='42501';
end if;
select * into v_current from public.crm_businesses
  where workspace_id=p_workspace and id=p_id for update;
if not found then raise exception 'Unknown business' using errcode='P0002'; end if;
if v_current.version <> p_expected_version then
  return jsonb_build_object('ok',false,'kind','conflict',
    'message','Another owner saved a change. Your draft is still here.',
    'current',to_jsonb(v_current));
end if;
-- Validated, allowlisted patch is applied next; actor/version/audit are set here.
```

Add `crm_changed_fields(p_before jsonb,p_after jsonb) returns jsonb` audit computation within this migration, comparing only changed allowed fields. Activity input contains `{kind:'outreach'|'reply'|'note'|'meeting'|'proposal',channel?:'email'|'phone'|'sms'|'social'|'other',occurredAt:string,summary:string,setReplied?:boolean}`. Reply logging with `setReplied` increments the business version and appends the reply atomically; changes never downgrade Won/Lost without an explicit confirmed stage edit. Contact updates use the same expected-version pattern in `crm_save_contact(p_workspace,p_business,p_input,p_expected_version,p_request_id)`.

The mutation-request ledger stores operation/payload/result under the authenticated
actor and workspace. Insert/lock its request key before changing a business;
same-ID/same-payload retries return the committed result, while a different
payload under that ID is rejected. Rows and ledger completion commit together.
This pattern also covers catalogue and billing mutations that are not prospect
activities. Ledger rows have RLS but are not added to Realtime publication.

Setting do-not-contact atomically cancels open follow-ups; new follow-ups/outreach
logs are rejected for that flag. Notes and historical replies remain recordable.
An archive flag hides active lists without deleting records. Bulk changes lock
selected IDs in a stable order, require all expected versions, cap at 100 rows,
and return conflicts without a partial update.

- [x] **Step 3: Implement scoped reads and owner action wrappers.** Always add `workspace_id` and use validated IDs/filters. Search escapes backslashes and `%`, `_`, comma, and parentheses before constructing Supabase filters; tests cover punctuation and adversarial filter strings. Prefer a bounded search RPC if compound filtering cannot be safely expressed. Derive last contact/next follow-up with an invoker-security view or checked read RPC; aggregate counts in SQL. Query failures throw, not return an empty successful list. Board queries request one stage/page at a time and show server counts.

```ts
export async function saveBusiness(id:string, expectedVersion:number, input:unknown, requestId:string) {
  const {client,context} = await requireOwner();
  const patch = parseBusinessPatch(input);
  const {data,error} = await client.rpc('crm_update_business', {
    p_workspace:context.workspaceId, p_id:parseUuid(id),
    p_expected_version:parseVersion(expectedVersion), p_patch:patch,
    p_request_id:parseUuid(requestId),
  });
  if (error?.code === '42501') return {ok:false,kind:'forbidden',message:'Your workspace access changed. Sign in again.'} as const;
  if (error) return {ok:false,kind:'unavailable',message:'That change did not save. Try again.'} as const;
  revalidatePath('/owner', 'layout');
  return data as MutationResult<Business>;
}
```

Client-origin request IDs remain stable through retries: generate them on the
form/controller before the first submission, validate them on the server, and
pass them to the RPC. A deliberate reapply is a new edit with a new request ID.
On conflict, return current values and preserve the submitted draft.

- [x] **Step 4: Build the actual workflow.** Table/board share the same filter URL, pagination, record counts, and underlying data. Include all specified columns/shortcuts. Provide new-business/contact forms, primary contact, active-owner assignment, priority/tags, edit/archive actions, channel/date/text activity form, attributed timeline, and follow-up complete/reschedule/cancel actions. Store form values in client state keyed by record ID and opened version; explicit save pending/error/success states. Bulk changes show a review dialog with count and patch before submission. Use plain-text React rendering and safe http/https/tel/mailto links from validated fields only.

- [ ] **Step 5: Verify the list/detail/board and conflict workflow with synthetic data.** Add notes concurrently and retain both authors; test filters over more than 50 records, pagination per board column, opt-out cancellation, wrong-workspace IDs, empty/error views, keyboard stage controls, and mobile layout. Run native tests/typecheck/build and available SQL checks. Commit: `feat: add shared outreach and follow-up workflows`.

## Task 4: Add client accounts, tool tracking, manual billing, and overview

**Files:** Create `lib/crm/time.ts`, `lib/crm/money.ts`, `lib/owner/{overview,clients,tools,billing}.ts`, client/tool/follow-up pages and forms listed in the file map, `tests/crm/billing-time.test.ts`. Extend mutations migration with `crm_convert_client`, `crm_save_client`, `crm_save_tool`, `crm_save_client_tool`, and `crm_save_billing`; extend SQL tests.

**Interfaces:** `convertClient(context,businessId,expectedVersion,requestId):Promise<MutationResult<ClientAccount>>`; `listClients(context,query):Promise<PageResult<ClientAccount>>`; `getClient(context,id)` returns client/business/contact/activity/tool/billing records; `ownerOverview(context)` returns real counts, due items, recent activity, and tool/client distribution. `workspaceTimeCandidates(local:string,timezone:string):string[]`, `invoiceState(record:BillingRecord,today:string):'paid'|'overdue'|'due'`, and `totalsByCurrency(records:BillingRecord[]):Record<string,string>` are pure exports. Currency totals are integer minor-unit strings so aggregate precision is retained. All CRUD RPCs use Task 3's permissions/version/idempotency pattern.

- [ ] **Step 1: Write failing conversion/billing/time tests.** Assert repeat/concurrent conversion yields the same one client ID, another workspace's venue/client/tool references are refused, manually created clients do not inflate outreach counts, and no subscriptions are invented.

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import type {BillingRecord} from '../../lib/crm/types.ts';
import {workspaceTimeCandidates} from '../../lib/crm/time.ts';
import {invoiceState,totalsByCurrency} from '../../lib/crm/money.ts';
test('Melbourne DST gaps and repeated times are explicit', () => {
  assert.deepEqual(workspaceTimeCandidates('2026-10-04T02:30','Australia/Melbourne'), []);
  assert.equal(workspaceTimeCandidates('2026-04-05T02:30','Australia/Melbourne').length, 2);
});
test('currency totals stay separate and a paid invoice is never overdue', () => {
  const a = {amount_minor:10000,paid_minor:10000,currency:'AUD',due_on:'2026-10-01'} as BillingRecord;
  const b = {amount_minor:2000,paid_minor:0,currency:'USD',due_on:'2026-10-20'} as BillingRecord;
  assert.equal(invoiceState(a,'2026-10-05'),'paid');
  assert.deepEqual(totalsByCurrency([a,b]), {AUD:'0',USD:'2000'});
});
```

Pin workspace midnight separately from the user's browser timezone. Add a
many-record aggregate whose total exceeds Number.MAX_SAFE_INTEGER; the integer
string must remain exact. SQL aggregates return numeric totals cast to text.

- [x] **Step 2: Implement strict dates/money and transactional conversion.** Date-only due dates compare with `Intl.DateTimeFormat('en-CA',{timeZone:workspace.timezone,year:'numeric',month:'2-digit',day:'2-digit'})` parts, not browser/UTC date slices. Minor-unit parsing uses decimal strings and bounded integers, not floating-point multiplication. `workspaceTimeCandidates` validates calendar parts, samples timezone offsets around the date using Intl parts, generates UTC candidates, and round-trips each back to the exact local minute. Zero candidates is a nonexistent time; two require an explicit earlier/later choice.

```ts
export function invoiceState(r:BillingRecord,today:string) {
  if (r.paid_minor === r.amount_minor) return 'paid' as const;
  return r.due_on < today ? 'overdue' as const : 'due' as const;
}
export function totalsByCurrency(rows:BillingRecord[]) {
  const totals = rows.reduce<Record<string,bigint>>((totals,r) => {
    totals[r.currency] = (totals[r.currency] ?? BigInt(0)) + BigInt(r.amount_minor) - BigInt(r.paid_minor);
    return totals;
  },{});
  return Object.fromEntries(Object.entries(totals).map(([currency,minor]) => [currency,minor.toString()]));
}
```

`crm_convert_client(p_workspace,p_business,p_expected_version,p_request_id)` locks
the business, returns an existing client if present, otherwise validates version,
creates one client, sets Won, and appends one activity in the same transaction.
Standalone `crm_save_client` creates a client-origin business when creating a new
account. Link only venues visible through the caller's existing venue membership;
do not expand booking RLS. Commercial tool records cannot change venue access.

- [x] **Step 3: Build client/detail/tools/billing forms with real data.** Catalogue entries are bookings, website, CRM, payments, advertising plus editable new names; availability is distinct from a client subscription. Seed names only, not client subscriptions/fees. Show active/paused/cancelled terms and manual balances grouped by currency. Client contacts and internal notes use the same business/contact/activity controls. Show the prospect link after conversion. Validated versions and retry IDs apply to every edit. Invoice due status updates with workspace date even if no rows changed.

- [x] **Step 4: Finish overview and follow-up queues.** SQL aggregates return active clients, pipeline counts, unassigned/replied prospects, due/overdue/upcoming follow-ups, recent attributed activity, and tool distribution. Provide working links into filtered lists. Display only supported data, honest empty cards, and separate currency totals; never label manually entered fees as payment-provider revenue. Follow-up queues exclude archived/do-not-contact businesses and completed/cancelled tasks.

- [ ] **Step 5: Run conversion/currency/DST tests, authorised SQL checks, typecheck/lint/build, and UI checks.** Verify 50+ clients paginate correctly, missing commercial fields are explicit, and client venue links retain existing console access. Commit: `feat: add client accounts tools and manual billing`.

## Task 5: Implement CSV parsing, mapping, cleanup, and duplicate preview

**Files:** Create the five `lib/crm/import` modules in the file map, `tests/crm/import.test.ts`, synthetic `tests/crm/fixtures/businesses.csv`. Modify `package.json`/lockfile to add `csv-parse@6` only at execution time.

**Interfaces:** `parseCsv(text:string):ParsedCsv` returns `{columns:{index:number,label:string,key:string}[],rows:{rowNumber:number,values:string[]}[]}`. `suggestMapping(columns):ColumnMapping` maps target fields to column indexes; duplicate header labels remain distinguishable. `normalizeRow(row,columns,mapping):NormalizedImportRow` returns business/contact fields, original `source`, labelled `extra`, and `issues:{field:string,message:string,severity:'warning'|'error'}[]`. `findCandidates(row,existing):DuplicateCandidate[]` flags email/phone/domain/name matches. `chunkImport(rows:NormalizedImportRow[]):NormalizedImportRow[][]` respects both bounds. `escapeCsvCell(value:string):string` protects any export from formula execution. `canonicalRowFingerprint(row):string` is a stable normalized identity used for exact repeat detection.

- [x] **Step 1: Write the malformed/branch/extra-column tests first.** Include BOM, CRLF, escaped quotes, embedded newline, empty line, missing name, duplicate header names, international/leading-zero phones, invalid optional contact values, JavaScript URLs, an oversized row, and same-domain branches with different locations. Rows retain logical record numbers after quoted newlines.

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCsv} from '../../lib/crm/import/csv.ts';
import {suggestMapping} from '../../lib/crm/import/mapping.ts';
import {normalizeRow} from '../../lib/crm/import/normalize.ts';
import {findCandidates,canonicalRowFingerprint} from '../../lib/crm/import/duplicates.ts';
test('CSV preserves text and multiline records', () => {
  const input = '\ufeffBusiness,Phone,Notes\r\n"Example, Cafe",0412345678,"First line\nSecond line"\r\n';
  const parsed = parseCsv(input);
  assert.equal(parsed.rows[0].values[0], 'Example, Cafe');
  assert.equal(parsed.rows[0].values[1], '0412345678');
  assert.equal(parsed.rows[0].values[2], 'First line\nSecond line');
});
test('extra columns and branch identity survive normalization', () => {
  const parsed = parseCsv('Business,Website,Location,Rating\nExample,https://example.test,A,4.8\nExample,https://example.test,B,4.2');
  const mapping = suggestMapping(parsed.columns);
  const a = normalizeRow(parsed.rows[0],parsed.columns,mapping);
  const b = normalizeRow(parsed.rows[1],parsed.columns,mapping);
  assert.notEqual(canonicalRowFingerprint(a),canonicalRowFingerprint(b));
  assert.equal(a.extra.Rating,'4.8');
  assert.ok(findCandidates(b,[a]).length > 0);
});
```

- [x] **Step 2: Add the parser and deterministic normalization.** Use array rows rather than `columns:true`, so duplicate headers are not lost; return indexed labels and stable keys like `rating:3`. Header synonyms cover company/business/name, suburb/location/address, industry/category, contact/person, email, phone/mobile, website/url, tags, notes. An owner can override every suggested mapping. No numeric casting or date casting. Reject malformed quoting/ragged records with a visible row error, rather than discard them. Keep original values alongside trimmed structured fields. Website values must parse as http/https before links are shown; email/phone validation does not guess missing data.

```ts
import {parse} from 'csv-parse/browser/esm/sync';
const records:string[][] = parse(text, {
  bom:true, cast:false, columns:false, skip_empty_lines:true,
  relax_column_count:false, max_record_size:128*1024,
});
// Reject absent headers, >5,000 data rows, >10 MiB UTF-8 bytes,
// and rows exceeding the JSON source-size cap; assign indexed headers next.
```

Exact-repeat keys include normalized name, location, all contact values, website,
and preserved source columns; notes/source differences are not discarded as exact
duplicates. Potential identity matches produce review candidates only. Phone
matching removes presentation punctuation but retains international prefixes;
never make a website/email globally unique across business branches.

- [x] **Step 3: Implement size-aware chunks and export escaping.** Account for UTF-8 bytes, commas, and request envelope; leave 4 KiB for batch/request metadata. Split before reaching 100 rows or 252 KiB of row JSON. Reject a single row that cannot fit. The server checks the final 256 KiB envelope too. Neutralize leading `=`, `+`, `-`, `@`, tab, carriage return, and whitespace-prefixed formula starts before quoting CSV output.

```ts
export function escapeCsvCell(value:string):string {
  const guarded = /^[\s]*[=+\-@]/u.test(value) || /^[\t\r]/u.test(value) ? "'"+value : value;
  return '"'+guarded.replaceAll('"','""')+'"';
}
```

- [x] **Step 4: Run Node tests for parsing/mapping and a 5,000-row synthetic fixture.** Assert every preserved column and original phone, stable repeat fingerprints, separate branch records, and chunks satisfying both limits. Run typecheck/build to verify the browser ESM entry under installed Next.js. Commit: `feat: add reviewed CSV mapping and normalization`.

## Task 6: Publish CSV imports atomically with a usable import wizard

**Files:** Create `supabase/migrations/20261007002000_crm_import.sql`, `components/crm/import/*`, `app/owner/outreach/import/page.tsx`, `app/owner/outreach/import/actions.ts`, `lib/crm/import/server.ts`, `lib/crm/import/controller.ts`, `tests/crm/import-state.test.ts`. Extend database tests and reusable query code.

**Interfaces:** Owner import actions are `beginImport(input):Promise<MutationResult<ImportBatch>>`, `stageImportChunk(input):Promise<MutationResult<ImportProgress>>`, `previewImport(batchId):Promise<ImportPreview>`, `setImportDecisions(batchId,decisions):Promise<MutationResult<ImportPreview>>`, `commitImport(batchId,requestId):Promise<MutationResult<ImportCounts>>`, `cancelImport(batchId):Promise<MutationResult<ImportBatch>>`, `getImport(batchId):Promise<ImportProgress>`. Input includes validated request IDs and logical row numbers. Counts partition source data rows into `businessesCreated`, `contactsLinked`, `exactDuplicatesSkipped`, `ownerSkipped`, and `rejected`; one row belongs to exactly one bucket. Preview distinguishes blocking errors from warnings.

- [x] **Step 1: Write retry/state and database tests before publishing logic.** A staged list remains absent from live businesses; repeated chunks are identical, reused row numbers with changed source return conflict, invalid source is not accepted just because the client called it normalized, and a retry of committed batch returns its saved counts.

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import {reduceImportState} from '../../lib/crm/import/controller.ts';
test('blocking rows prevent publishing and wrong-batch completions are ignored', () => {
  const blocked = {kind:'preview' as const,batchId:'batch-a',blockingErrors:1};
  assert.deepEqual(reduceImportState(blocked,{type:'PUBLISH',requestId:'request-a'}),blocked);
  const ready = {...blocked,blockingErrors:0};
  const publishing = reduceImportState(ready,{type:'PUBLISH',requestId:'request-a'});
  assert.equal(publishing.kind,'importing');
  const counts = {businessesCreated:1,contactsLinked:0,exactDuplicatesSkipped:0,ownerSkipped:0,rejected:0};
  assert.deepEqual(reduceImportState(publishing,{type:'COMMITTED',batchId:'batch-b',counts}),publishing);
  const completed = reduceImportState(publishing,{type:'COMMITTED',batchId:'batch-a',counts});
  assert.equal(completed.kind,'complete');
  assert.deepEqual(reduceImportState(completed,{type:'PUBLISH',requestId:'request-b'}),completed);
});
```

Define `createImportController(dependencies):ImportController` in
`lib/crm/import/controller.ts` for this test and wizard; dependencies match the
seven actions above. It uses exported `reduceImportState(state,event):ImportState`
with PREVIEW/PUBLISH/COMMITTED/FAIL/RESUME/CANCEL events. A preview carries batchId
and blockingErrors; importing carries batchId and stable requestId; complete
carries batchId and counts. Wrong-batch/stale completions and repeated publishing
are ignored. FAIL retains the batch ID and last successful checkpoint for retry;
CANCEL is effective only after the checked cancellation action succeeds. Test
network loss after staging/commit, explicit cancellation,
blocking invalid-name rows, multiple contacts linked to one business, another
workspace's batch IDs, and a 5,000-row import with accurate counts.

- [x] **Step 2: Implement checked staging RPCs and server normalization.** RPC names: `crm_begin_import`, `crm_stage_import`, `crm_preview_import`, `crm_decide_import`, `crm_commit_import`, `crm_cancel_import`. Each uses `crm_can_access` and scope checks. Server normalization reuses Task 5's pure normalization from the submitted source/mapping, never trusts normalized/actor/workspace values. Enforce byte/row/chunk limits, cumulative totals, known mappings, source row numbers, and a cryptographic digest. The browser file digest is advisory: raw-file bytes are not uploaded. At finalization compute the authoritative fingerprint from the staged canonical columns/source rows/mapping. Do not use filename, declared file digest, or editable decisions as the uniqueness authority.

`crm_begin_import` creates a batch ID or resumes an authorised matching staged
batch by its existing ID/advisory digest, without trusting that digest for publish
deduplication. Its authoritative fingerprint is null until finalization. A
partial unique index covers only committed workspace/fingerprint pairs. Source chunks are
immutable once accepted; mapping/decision revisions are tracked until ready.
`crm_preview_import` returns potential duplicates, blocking issues, and every
unmapped column without making rows live. Decision targets must be visible in the
same workspace; link_contact appends a contact/source note, never replaces an
existing primary contact, assignment, stage, or history.

- [x] **Step 3: Make finalization one idempotent transaction.** Lock the batch, verify all staged rows, compute its authoritative fingerprint, and acquire an advisory transaction lock for the workspace. Imports in different workspaces proceed independently; same-workspace publishing is serialized, including differently mapped overlapping files. Verify expected row count, decisions, target references, mandatory names, and source-derived normalized data before any live insert. Check the unique committed fingerprint under the lock. If another batch already committed it, mark this batch `reused`, set its scoped `duplicate_of`, and return the saved existing result without publishing new rows. Otherwise publish businesses/contacts and provenance, append an import summary activity, save the disjoint counts, then mark committed. Any exception rolls the whole publication back. A completed identical import cannot be made fresh by editing client file metadata. Use set-based validation/publishing and benchmark the 5,000-row case against the actual RPC timeout; timeout still rolls back the whole batch.

Define internal helper `crm_import_fingerprint(p_workspace uuid,p_batch uuid)
returns text` in this migration. Its input is a JSONB object containing stored
indexed columns, the stored mapping, and ordered source rows. Hash its canonical
text with SHA-256 through the project's verified pgcrypto extension schema.
Revoke helper execution from PUBLIC/anon/authenticated; it is called only inside
the checked definer RPC. A committed/reused batch is immutable.

Publish accepts at most one receipt for each exact source-row fingerprint in a
workspace, using the partial unique index on `crm_import_rows`. If accepted by an
earlier batch, this source row is counted as an exact duplicate even if mapping
or decisions differ; it never overwrites the earlier business. Rows accepted as
new businesses or linked contacts receive `published_at` and target IDs; skipped
rows retain their outcome and provenance but no accepted receipt. This also
handles repeated identical rows inside one file.

```sql
-- Inside crm_commit_import after access validation:
select * into v_batch from public.crm_import_batches
  where workspace_id=p_workspace and id=p_batch for update;
if not found then raise exception 'Unknown import' using errcode='P0002'; end if;
if v_batch.state in ('committed','reused') then return v_batch.counts; end if;
if v_batch.state='cancelled' then raise exception 'Import cancelled'; end if;
v_fingerprint := public.crm_import_fingerprint(p_workspace,p_batch);
perform pg_advisory_xact_lock(hashtextextended(p_workspace::text,0));
-- Validate all staged decisions before any live insert; publish and save counts
-- in this same transaction. No per-chunk commits into crm_businesses.
```

- [x] **Step 4: Build Select → Map → Preview → Import → Complete.** Lazy-load the CSV library after file selection. Show row errors/warnings, retained extras, existing-business candidates, explicit keep/skip/link-contact decisions, total counts, progress, resumable batch status, cancel and retry. Preview review is the owner's import confirmation; uploading does not automatically send outreach. Disable Publish while blockers are unresolved. Selection changes reset stale mapping/decisions; refresh resumes a staged batch after the original file is reselected and fingerprints match. Persist only batch IDs/settings, not contacts/CSV text, in browser storage. Actual CSV remains out of Git.

- [ ] **Step 5: Execute two independent import attempts with identical synthetic CSV, dropped-response retries, and a cancelled batch.** Verify only one published list and count reconciliation. Test a branch with a shared domain and deliberate link-contact choices. Once the real CSV is supplied, preview its mappings and counts with the user, import it into the approved private workspace, and sample source versus resulting records. Commit: `feat: add transactional CSV import and review wizard`.

## Task 7: Synchronize owners without losing unsaved work

**Files:** Create `supabase/migrations/20261007003000_crm_realtime.sql`, `components/crm/live-refresh.tsx`, `components/crm/draft-state.tsx`, `lib/crm/live-state.ts`, `lib/crm/draft.ts`, `tests/crm/live-state.test.ts`. Integrate live/draft provider into owner layout and reusable forms.

**Interfaces:** `WorkspaceLiveRefresh({workspaceId,url,anonKey,onStatus}):JSX.Element`; `LiveStatus='live'|'reconnecting'|'disconnected'`; pure `reduceLiveState(state,event):LiveState` for subscribe/error/reconnect/focus/auth-expiry. `useRecordDraft<T>(key,serverRecord)` returns `{draft,setDraft,dirty,openedVersion,remoteVersion,discard,reapply,markSaved}`. `reapply` is explicit and requires reviewing newest values; it never auto-saves.

- [ ] **Step 1: Write event/draft tests.** Debounced duplicate notifications cause one re-fetch; reconnect/focus triggers a catch-up; disconnected polling is 30 seconds; auth expiry cancels subscription/polling and clears private client state. A changed server record with a dirty draft retains draft/initial version and exposes the new remote version; clean forms accept it.

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraftState,updateDraft,receiveServerRecord} from '../../lib/crm/draft.ts';
test('remote updates do not replace an unsaved draft', () => {
  const state = createDraftState({id:'business',version:1,name:'Old'});
  const edited = updateDraft(state,{name:'My unsaved edit'});
  const incoming = receiveServerRecord(edited,{id:'business',version:2,name:'Other owner'});
  assert.equal(incoming.draft.name,'My unsaved edit');
  assert.equal(incoming.openedVersion,1);
  assert.equal(incoming.remoteVersion,2);
});
```

Define these pure draft functions in `lib/crm/draft.ts`; the React hook wraps
them. `markSaved` updates baseline only with the committed server result. Dirty
forms are keyed by record ID, not version, so RSC refresh cannot remount them.

- [x] **Step 2: Add insert/update publication and authenticated listeners.** Publish businesses, contacts, activities, follow-ups, clients, client tools, billing records, and tool catalogue. Use existing `browserSupabase` with the signed-in session; no anonymous/private-data mode. Subscribe with `workspace_id=eq.<validated UUID>` filters, send no broad cross-workspace payloads, and map actual subscription status to the indicator. Remove channels/timers/listeners on unmount or sign-out. Capture token refresh events and ensure the renewed aal2 token is used; access loss clears state and routes to reauthentication.

```ts
const tables = ['crm_businesses','crm_contacts','crm_activities','crm_follow_ups',
  'crm_clients','crm_client_tools','crm_billing_records','crm_tool_catalog'];
let channel = client.channel(`owner:${workspaceId}`);
for (const table of tables) for (const event of ['INSERT','UPDATE'] as const) {
  channel = channel.on('postgres_changes', {
    event,schema:'public',table,filter:`workspace_id=eq.${workspaceId}`,
  },scheduleRefresh);
}
channel.subscribe(status => updateStatus(status));
```

Implement `scheduleRefresh` as a 150 ms debounce calling `router.refresh()`;
`updateStatus` dispatches `reduceLiveState` and manages 30-second fallback polling.
Do not expose a Live label just because the browser is online. Refresh on initial
successful subscription/reconnection and focus. Use normal app read errors to
surface revoked permissions; token validity alone is not owner membership.

- [x] **Step 3: Integrate draft conflict UI and time-sensitive counts.** Show changed-field/current-value context for conflicts, preserve input, offer Reload and Review/reapply. Preserve list filters, pagination, selected record, and import progress through refresh. Follow-up/overdue counts refresh at workspace midnight and on focus, in addition to data events.

- [ ] **Step 4: Verify live behavior using two genuinely independent authorised sessions.** Separate browsers/devices/profiles must hold different owner tokens; two tabs sharing one session are insufficient. Change assignment, stage, reply, follow-up, client tool, billing, and catalogue; measure visibility within five seconds. Save competing edits, append simultaneous notes, interrupt/reconnect the network, and revoke a test membership. Verify a client/aal1 session receives no private events. If live access/setup is unavailable, leave these checks explicitly pending. Commit: `feat: synchronize owner CRM changes and protect drafts`.

## Task 8: Complete verification, setup documentation, and a reviewable delivery

**Files:** Create `docs/owner-dashboard-setup.md`; update `docs/console-setup.md` with owner/client routing and links to setup. Update this plan's checkboxes only as work passes. Keep local screenshot outputs in ignored `docs/owner-dashboard-captures/`.

**Interfaces:** Deliver one working branch and a Vercel preview; use the existing connected project and database. No new database/project is created just to manufacture a demo. Real launch requires the three supplied owner accounts and verified Supabase access.

- [ ] **Step 1: Bootstrap only approved owners on the verified project.** Resolve supplied emails to existing Supabase UUIDs; use the service's trusted account workflow if an account needs creation. Insert exactly the approved active platform memberships and internal workspace memberships/display names. Never infer the other founders' identities from repository contributors. MFA enrollment is completed by the users themselves. Store no credentials or personal membership seed in Git.

```sql
-- Parameterized through the trusted setup interface, never real emails in Git:
insert into public.platform_owners(user_id,active) values ($1,true)
on conflict(user_id) do update set active=true;
insert into public.crm_workspace_members(workspace_id,user_id,display_name,active)
select id,$1,$2,true from public.crm_workspaces where slug='peregrine'
on conflict(workspace_id,user_id) do update set display_name=excluded.display_name,active=true;
```

- [ ] **Step 2: Apply and verify additive migrations through the connected Supabase project.** Identify the actual linked project first, inspect migration state (including the existing two-step and notifications migrations), and apply only missing migrations in timestamp order. Verify table/policy/function grants, actor/version behavior, and Realtime publication. Run rollback-only database checks and document actual outputs without secrets. Do not treat a locally written migration as live schema.

- [ ] **Step 3: Run the complete checks.** `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`; fix errors and repeat only affected checks. Verify original booking login/MFA/console actions/notifications, correct owner landing, list/filter/pagination, CSV source reconciliation, conversion, currency/time behavior, conflict protection, live update timing, session expiry, and no client access. Inspect build/committed output for private data and keys. Review desktop and phone widths, keyboard controls, loading/error/empty behavior; save screenshots for the owner dashboard and outreach flow.

- [ ] **Step 4: Deploy a branch preview using the existing Vercel project and verify it with authorised sessions.** Keep production on the existing release until the concrete implementation and migration checks pass. Write setup docs showing migrations, approved-owner bootstrap, CSV import, manual reply/billing limits, live checks, and later client-workspace boundaries. If any required live check cannot run, report its exact missing input and never label the dashboard ready for production.

- [ ] **Step 5: Review the whole branch, then create and attach a draft PR if delivery is otherwise complete.** Description leads with owner workflow and resulting behavior, lists material validation and pending live inputs, and omits conversation history. Stage only feature files; preserve unrelated local edits. Attach every created PR using the Codex artifact tool. Give the user the preview, PR, and key verification result; request production approval only on that concrete result if deployment approval is needed.

## Verification status — 2026-10-06

Tasks 1–7 are implemented and locally verified. Checked steps indicate completed
implementation or local checks; combined acceptance steps remain open where they
require the live Supabase project, separate owner sessions or the real CSV.
Native suite: 24 tests passed. All five CRM migrations and rollback SQL suites
passed in disposable PostgreSQL, including a 5,000-row import. Feature lint and
TypeScript passed; the supported webpack production build passed. Repository
lint still reports the two pre-existing public-site errors. Desktop/phone shell
and board captures use the real presentation components with synthetic fixtures;
they do not verify authenticated interactions. See the founder setup guide for
remaining launch checks. Task 8 and production readiness remain open.

## Coverage and execution handoff

| Approved requirement | Owning task |
| --- | --- |
| Private founder access, MFA, client separation | 1–2; live verification 8 |
| HighLevel-style owner shell, responsive/accessibility states | 2; finished UI verification 8 |
| Search, filters, table/board, assignment, priorities, extra fields | 3 and 5–6 |
| Contacts, attributed outreach/replies/notes, follow-ups, opt-out | 3 |
| Client conversion, tools, manual billing, real overview counts | 4 |
| CSV preview/mapping, original values, branch-safe duplicate review | 5–6 |
| Bounded/resumable staging, atomic publish, concurrent import safety | 6 |
| Live updates, reconnect, author/version conflicts, draft retention | 3 and 7 |
| Reusable workspace-scoped client CRM foundation | 1 and 3; client UI remains outside this release |
| Real CSV and owner setup, deployed verification, booking regression | 8 |

Self-review must confirm each interface used by a later task is produced above,
each Review Focus condition has the specified test, and no step claims a live
check passed without database access. This document is a plan, not completed work.

Recommended execution: **Native**. Implement the eight dependent tasks in this
session with focused tests, then obtain a fresh whole-branch review. This keeps
the database/auth/import interfaces under one implementer and avoids repeated
context setup. **Subagent-driven** is available if the user prefers separate
implementer/reviewer passes at each task. User review and choice are required
before either execution path begins.

## Primary references

- Installed Next.js: `node_modules/next/dist/docs/01-app/02-guides/authentication.md`, `01-app/01-getting-started/07-mutating-data.md`, `01-app/02-guides/server-actions.md`, and `01-app/01-getting-started/05-server-and-client-components.md`.
- [CSV Parse browser ESM](https://csv.js.org/parse/distributions/browser_esm/)
- [CSV Parse sync API](https://csv.js.org/parse/api/sync/)
- [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Supabase database testing](https://supabase.com/docs/guides/database/testing)

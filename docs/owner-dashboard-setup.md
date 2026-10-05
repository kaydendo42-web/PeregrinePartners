# Founder workspace setup

The founder workspace lives at `/owner` in the existing Peregrine application.
It uses the existing Supabase project and Vercel project. Do not create another
database for this release. Ordinary client accounts continue to use their venue
console; a venue `owner` role does not grant founder access.

## Connection and launch order

1. Install and connect the Supabase plugin using the account that owns the
   existing Peregrine project. Authorize that project through the provider's
   sign-in flow. Never paste passwords, database passwords, access tokens, or
   service-role keys into chat or Git.
2. Verify the project identity against the existing deployment's Supabase URL.
   Inspect the live migration history before applying anything. The existing
   bookings, two-step authentication and venue-notifications migrations must be
   accounted for first; do not rerun them blindly.
3. Apply only the missing founder migrations, in this order:

   - `20261007000000_owner_crm.sql`
   - `20261007001000_crm_mutations.sql`
   - `20261007001500_crm_commercial.sql`
   - `20261007002000_crm_import.sql`
   - `20261007003000_crm_realtime.sql`

4. Resolve the three approved owner emails to real Supabase user UUIDs through
   the trusted account administration interface. If an account is missing, use
   the provider's account invitation workflow. Keep the real owner list private.
5. Add each approved UUID to both founder access lists using the parameterized
   statements below. Each owner enrolls their own authenticator and completes
   two-step verification. The dashboard requires an `aal2` session.
6. Deploy and check the branch preview with authorized sessions. Check Jenny's
   existing booking login and console too. Release to production only after the
   live checks below pass.

### Private owner bootstrap

Run through a trusted administrative interface, supplying `$1` as the approved
user UUID and `$2` as their chosen display name. These are prepared-statement
parameters, not text to paste unchanged into the SQL editor. Never commit a
personal membership seed.

```sql
begin;
insert into public.platform_owners(user_id, active) values ($1, true)
on conflict(user_id) do update set active = true;

insert into public.crm_workspace_members
  (workspace_id, user_id, display_name, active)
select id, $1, $2, true
from public.crm_workspaces where slug = 'peregrine'
on conflict(workspace_id, user_id)
do update set display_name = excluded.display_name, active = true;
commit;
```

Removing either active membership denies founder data access. Database checks
require active founder status, active membership of the internal workspace,
and two-step verification. Future client workspaces are denied in this release.
All writes go through checked database functions; browser roles cannot directly
write founder tables or grant themselves membership.

## Using the workspace

- **Overview:** real client, outreach, follow-up and reply counts, team activity,
  subscribed tools and manually entered balances. Empty accounts show empty
  states rather than sample clients or invented revenue.
- **Clients:** add an existing client or convert an outreach business. Conversion
  preserves its conversation history and creates at most one client record.
- **Tools:** maintain the catalogue and each client's subscription status. A
  catalogue entry alone is not a subscription.
- **Outreach:** switch between table and stage board, filter and assign records,
  add contacts, log conversations and replies, and set follow-ups. A do-not-contact
  or archived business cannot receive a new outreach entry or open follow-up.
- **Follow-ups:** deadlines use the workspace timezone, initially
  `Australia/Melbourne`. Repeated daylight-saving times require an explicit
  occurrence; nonexistent local times are rejected.

Replies, notes, billing and subscription statuses are entered by the team.
This release does not send emails, texts, invoices or payment reminders, connect
mailboxes, charge cards, or automatically reconcile payments. Log the outcome
after using the team's existing communication and payment channels.

### CSV import

1. Select a CSV of up to **10 MiB, 5,000 business rows and 200 columns**. The file
   is parsed locally first. Quoted commas, multiline cells, duplicate headers,
   original values and leading zeros in phone numbers are retained.
2. Map columns to business and contact fields. Every source field remains
   available under its original heading plus column number.
3. Stage bounded chunks, then review the database preview. Staging creates no
   live businesses or contacts. Invalid rows must be corrected in a new import
   or explicitly skipped before publication.
4. Review potential duplicates. Shared domains alone do not merge branches.
   Link an additional contact only to a reviewed business in this workspace.
5. Publish. The database commits the accepted rows and receipt together. The
   receipt reconciles created, linked, duplicate, skipped and rejected source
   rows to the total. Repeating the same source and mapping reuses the completed
   receipt even if the filename changes.

Interrupted staging can resume while its browser reference remains available.
Mapping changes after staging require cancelling and starting again. Cancelling
an uncommitted batch publishes nothing. If publication times out, retry the same
batch; inspect its status before starting another import. The request and batch
receipts protect retries from publishing twice.

CSV downloads neutralize spreadsheet formulas. Imported text remains untrusted
and is rendered as text, never executable markup.

### Shared edits and live updates

The header shows **Live** only after the scoped realtime subscription connects.
Reconnect, focus and periodic checks catch up changed data. Unsaved record fields
remain in place when another owner edits the record. Saving an old version shows
a conflict and offers explicit reload/reapply actions. A lost session or revoked
membership withdraws the private interface and requires sign-in again.

## Verification and current limits

Local native tests cover destinations, validation, drafts, import states and
CSV cases, precision-safe currency values, and Melbourne daylight-saving times.
Rollback-only SQL checks exercise policies, grants, versions, attribution,
idempotence, conversion, manual billing and import publication in a disposable
PostgreSQL engine. `supabase/tests/run-local.mjs` connects only to that disposable
engine, never to the live project. A synthetic 5,000-row publication passed there;
its initial measured publication took 29.537 seconds in the WASM test engine.

The actual Supabase timeout and concurrent sessions still need live verification.
Do not run the local fixture scripts unchanged against production: their test
authentication schema and fixture users belong only to the disposable harness.
Live verification must use approved accounts and reversible isolated test rows.

Before production, record results for:

- project identity, migration history, grants and realtime publication;
- all three approved owners, non-owner rejection and two-step verification;
- ordinary client login, booking actions and venue notifications;
- simultaneous owner edits, stale conflicts, authorship and unsaved drafts;
- live update timing, reconnect, expiry and membership revocation;
- simultaneous/retried imports, receipt reconciliation and the actual outreach CSV;
- desktop, phone, keyboard, empty, loading and error states on the preview.

The implementation branch is not production-ready until these live checks pass.
The real outreach CSV and service connection are separate inputs; a synthetic
test file is not a substitute for checking the team's file.

## Development checks

```sh
npm test
npx next typegen
npx tsc --noEmit
npm run lint
npm run build
```

Where the desktop sandbox blocks Turbopack's local worker port, Next's supported
`npx next build --webpack` command verifies the production build. No framework
configuration is changed for that local limitation. Existing repository-wide
lint errors in `screen-face.tsx` and `floor-boot.tsx` are separate from this feature.

To run the disposable SQL suite, install PGlite outside this repository and set
`CRM_TEST_ENGINE` to its absolute `dist/index.js` path:

```sh
CRM_TEST_ENGINE=/absolute/test-runtime/node_modules/@electric-sql/pglite/dist/index.js \
  node supabase/tests/run-local.mjs
```

## Later client workspaces

The schema and reusable CRM components carry a workspace ID throughout. Opening
the CRM to clients requires a separate authorization/UI release with client
membership policies and cross-workspace tests. Do not copy the internal founder
policies or grant platform-owner membership to clients. Bookings, payments and
other tools can attach to a client account without weakening this boundary.

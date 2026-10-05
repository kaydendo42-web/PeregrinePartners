# Peregrine owner dashboard and shared outreach CRM

Date: 2026-10-05
Status: Written design for owner review; product implementation has not started.

## Outcome and agreed direction

The three Peregrine owners need one private place to manage their clients and
business outreach. Each owner uses their own login. When one owner assigns a
prospect, records a reply, changes a stage, or schedules a follow-up, the others
see the committed change without reloading the page.

The user selected reference A, HighLevel's agency dashboard. Adopt its agency
overview, left navigation, client accounts, summary cards, and reports, using
Peregrine's own branding. This first release implements the owner dashboard and
outreach workflow. Additional HighLevel-style tools can follow as separate
features; existing client bookings remain available throughout.

The client CRM will eventually run as the same product in separate private
workspaces. Its data model should support that reuse now, without separate code
copies or a new database per client. Client CRM access is a later release.

## Approach

Recommended: extend this Next.js app, existing Supabase authentication/database,
and Realtime. This retains the existing login and deployment, and gives us a
shared source of truth for the three owners.

Alternatives considered: integrating self-hosted Twenty gives us a larger CRM
engine but adds a separate backend, database, and identity/data integration;
using HighLevel itself gives us its agency product but makes this workflow depend
on its service and integration with Peregrine. The selected visual direction does
not require either service. No new external service is needed for this release.

## First-release screens

| Screen | Working behavior |
| --- | --- |
| Overview | Real counts for clients and outreach; follow-ups due; unassigned prospects; recent team activity; client/tool distribution. |
| Clients | Searchable client accounts with primary contact, relationship owner, linked existing venue where relevant, internal notes, and subscribed tools. |
| Client detail | Contacts, active/paused/cancelled tool records, prices and billing cadence if entered, manual billing records, and activity history. |
| Outreach | Searchable, filterable prospect table and stage board; assignment, priority, tags, last contact, and next follow-up. |
| Prospect detail | Business information, contacts, original import extras, stage, assigned owner, activity timeline, and follow-up controls. |
| Follow-ups | Due today, overdue, upcoming, and completed items, filtered by owner. Links back to their prospect or client. |
| Tools | Catalogue and per-client tool records for bookings, website, CRM, payments, advertising, and new tools added later. |

Billing is recorded manually in the first release because the current billing
provider and charging model have not been supplied. Amounts use integer minor
units plus a currency; different currencies are not added together. A due invoice
is overdue only when its due date has passed and a balance remains. No automatic
charges, email reminders, or invented revenue appear in this release. Recording
a tool subscription does not itself provision a tool or grant client access.

All counts come from saved data. Empty databases show clear empty states and a
useful first action. Tool records and client subscriptions are not guessed from
the presence of a venue. An existing venue can be linked to a client account;
its booking permissions and data remain governed by the existing membership.

## Layout and visual behavior

A charcoal sidebar carries Peregrine, Overview, Clients, Outreach, Follow-ups,
and Tools. The main area is a light surface with a page title, date/filter
controls, restrained summary cards, and the useful list or report beneath.
Outreach defaults to the table; the board is a second view of the same records.

Table columns: Business, Location, Industry, Contact, Stage, Assigned owner,
Priority, Last contact, Next follow-up, and Updated by. Owners can sort by
business, last contact, next follow-up, or most recent change. Filters combine
search, stage, owner, location, industry, tags, priority, and import batch. Useful
shortcuts include My prospects, Unassigned, Replies, and Follow-ups due.

Clicking a business opens its detail page. Inputs have explicit save and pending
states. Keyboard users can use every control; stage changes do not require
dragging cards. On small screens, the sidebar becomes a menu and records remain
readable as compact cards or a scrollable table. Status always has a text label.
Public marketing pages and Jenny's booking console retain their existing styles.

## Outreach workflow

Stages: New, Contacted, Replied, Meeting booked, Proposal sent, Won, and Lost.
Do not contact is a separate flag, shown clearly and excluded from outreach and
follow-up queues. Recording it cancels open follow-ups for that business.

An owner can assign a business to any active owner, or leave it unassigned. Bulk
assignment, tags, and stage changes show the selected count before applying.
Each business has a priority of low, normal, or high; imports default to normal.

Logging outreach records the channel (email, phone, SMS, social, or other), time,
summary, and author. Logging a reply can change the stage to Replied in the same
save. Replies are entered manually in this release; importing an email address
does not connect an inbox or send a message. Meeting/proposal activity is also a
record of the event, rather than a new scheduling or document system.

A follow-up has a due date/time, assigned owner, and short instruction. Complete,
reschedule, and cancel are distinct actions. All dates display in the workspace
timezone, initially Australia/Melbourne, and store as UTC timestamps.

Marking Won offers Convert to client. Conversion is explicit and transactional:
create one client account from the business/contact data, retain a link to the
prospect and its history, and prevent a second conversion. It does not create
client credentials, automatically provision bookings, or invent subscriptions.

The activity timeline records notes and committed changes with the actor and
timestamp. Entries are appended rather than replacing one shared notes field.
Mistakes can be corrected with a new entry. Archiving hides a record from active
views while retaining its history; no hard-delete action is exposed.

## CSV import and data presentation

The user's CSV is not yet present in the workspace. The import is designed to
adapt to its headers rather than require a new spreadsheet format.

1. Select a CSV. Parse quoted commas, quoted newlines, escaped quotes, CRLF/LF,
   and UTF-8 with or without a byte-order mark. Preserve phones and identifiers
   as text, including leading zeroes.
2. Suggest column mappings for business name, location/address, industry,
   contact name, email, phone, website, tags, and notes. The owner can correct
   them. Business name is required; missing contact information is allowed and
   appears in an Incomplete contact filter. Multiple contact rows can be linked
   to one business after review.
3. Preview normalized records, errors, potential duplicates, and unmapped
   columns. Trim unnecessary whitespace; keep original spelling, phone values,
   and source values. Validate email and http/https website formats without
   guessing a country code or inventing missing details. Invalid optional
   contact values stay visible as flagged source values, not callable links.
4. Exact repeat rows are skipped. Shared domains, emails, phones, or similar
   names flag possible duplicates; they do not automatically merge different
   branches or businesses. The owner chooses to skip, keep separately, or add
   a contact to an existing business. Existing assignments, stages, notes, and
   follow-ups are never overwritten by an import.
5. Confirm the import and its totals. Rows with missing business names cannot be
   committed; the preview lets the owner skip them explicitly. Completion shows
   imported, skipped, duplicate, and rejected counts with row-level reasons.

Unmapped columns are preserved as labelled extra fields on each business, along
with import batch and source row number. Structured columns make the main table
readable; extra information remains accessible on the detail page. The actual
CSV will determine useful extra fields once supplied.

Initial limits: 10 MiB and 5,000 rows per file. Parse locally, send validated
staging chunks of at most 100 rows and 256 KiB, and enforce all limits and field
validation again on the server. An import batch is scoped to the workspace and
tracks its fingerprint, mapping, decisions, progress, and counts. A final
transaction publishes the batch; staged rows never appear as live prospects.
Retries are idempotent and concurrent identical imports cannot duplicate rows.
An interrupted import can resume or be cancelled without a partial live list.

CSV files and real prospect data must not be committed to this public GitHub
repository. Source values live only in the private database. Do not fetch
business websites or enrich records automatically. Render imported text as text,
never HTML; any CSV export must neutralize spreadsheet formulas.

## Data and permissions

Use a separate `platform_owners` membership keyed to Supabase user IDs. A venue
member with role `owner` is a client owner, not a Peregrine platform owner.
Membership cannot be granted by editing a profile or importing a CSV. Bootstrap
the three approved accounts through the trusted database setup after their email
addresses are supplied. Keep credentials and private account setup out of Git.

The reusable CRM tables are workspace-scoped:

| Entity | Purpose |
| --- | --- |
| Workspaces and workspace members | One internal Peregrine workspace and its three owners; foundation for future private client workspaces. |
| Businesses and contacts | Prospect/company details, contacts, stage, assigned owner, priority, tags, source fields, archive flag, and record version. |
| Activities and follow-ups | Attributed history and dated work attached to a prospect or client. |
| Client accounts | Peregrine's commercial relationship, optionally linked to an existing venue and converted prospect. |
| Tool catalogue and client tools | Extensible tool names, subscription status, commercial terms, and start/end dates. |
| Billing records | Manually recorded amounts, due dates, and payment status. |
| Import batches and staged rows | Validated imports, provenance, duplicate decisions, resumable progress, and final totals. |

Every child relationship enforces matching workspace IDs in the database.
Assigned users must be active members of that workspace. Actor IDs, creation
times, and version increments are set by the database, not trusted from a form.

Row-level security protects all new tables, including import staging and
activity history. The internal workspace requires active platform-owner
membership and a two-step (`aal2`) session. No anonymous read/write is allowed.
Client CRM workspaces are not exposed in this release. Enabling one later
requires scoped membership and the same engine, with no access to the internal
workspace or another client's records. No broad change is made to existing
booking-table permissions, venue membership, or public booking writes.

## Authentication and application boundaries

Add `/owner` routes to the existing app and sign-in flow. Successful default
sign-in sends a platform owner to `/owner`; other users continue to `/console`.
Explicit authorised client-console destinations still work for founders who
support a venue. Next destinations are restricted to exact `/owner` and
`/console` path roots and their descendants, with external URLs rejected.

Extend session refresh and two-step checks in `proxy.ts`, the sign-in actions,
and the email-link confirmation flow. Protect each owner read and mutation in a
small server-only data access layer; a layout or hidden navigation item is not
the security boundary. Use the signed-in Supabase client, never a browser
service-role key. Owner data must never enter the existing console demo mode.

Keep the reusable CRM data, import, and mutation logic separate from the owner
shell. The owner pages compose those modules with platform-only client/tool
management. Future client CRM pages can reuse the core with another workspace.
Do not refactor the booking console as part of this work.

## Real-time collaboration and conflicts

Persist each change to Supabase, then subscribe authorised sessions to workspace
changes in businesses, contacts, activities, follow-ups, client accounts, client
tools, and billing records. Subscribe to insert/update events only; records are
archived rather than deleted. The database's row-level security governs which
events a session can receive.

Events trigger a debounced re-fetch of the currently visible server data and
summary counts. Tables use server-side filtering and pagination (50 records per
page). Board columns paginate independently and show their total counts. Do not
load an entire imported list into every browser to calculate summaries.

Each editable record has an incrementing version. A save supplies the version
the owner opened. The database updates only when that version still matches,
and writes the change/activity in the same transaction. If another owner saved
first, keep the unsaved draft and show the newer values with a choice to reload
or intentionally reapply the edit. Never silently overwrite somebody else's
work. Append-only activity entries can be saved concurrently.

Show Live, Reconnecting, or Disconnected accurately. Refetch on reconnection and
window focus to recover missed events. While disconnected, poll every 30 seconds
and state that updates may be delayed. Refreshes must preserve filters, selected
business, and unsaved drafts. Failed writes retain input and show a retry action;
they are not represented as saved changes. Clear channels and private state on
sign-out or an access/session failure.

## Acceptance and verification

1. The three approved owners can sign in with two-step authentication and reach
   the owner dashboard; a client user cannot read, mutate, or subscribe to its
   records, including by direct API calls. `aal1` sessions are also denied.
2. Import a representative CSV fixture covering quoting/newlines, missing data,
   leading zeroes, extra columns, shared domains, duplicate rows, and invalid
   contact values. Counts reconcile and repeat/concurrent import is safe.
3. Import the user's actual file after preview review; reconcile its counts and
   sample the resulting business/contact records against the source.
4. Two independent owner browser sessions see committed assignment, stage,
   reply, follow-up, and billing changes automatically. Target visibility within
   five seconds on a healthy connection; measure it rather than assume it.
5. Concurrent edits produce a visible conflict and preserve the second draft.
   Concurrent notes both persist with correct authors. Reconnection catches up.
6. Converting the same prospect twice yields one client; workspace references,
   owner assignment, tool terms, and billing calculations are validated.
7. Verify keyboard/mobile flows, honest loading/error/empty states, safe text
   rendering, and absence of private data or credentials in build output.
8. Run type checking, lint, and production build. Verify existing client login,
   two-step auth, console routing, bookings, and venue notifications still work.
9. Apply and verify migrations and Realtime publication on the correct Supabase
   project before claiming the feature live. Verify the deployed Vercel preview
   with real authorised sessions before production rollout.

## Inputs needed for launch

The CSV, the three owner email addresses, and access to the existing Supabase
project are needed to import real prospects, register owner memberships, apply
and verify the schema, and test collaboration. They are configuration inputs,
not grounds to invent sample customers or bypass access controls. GitHub and
Vercel access were verified; live Supabase access is not yet available in this
session.

## References

- [Selected HighLevel agency dashboard](https://help.gohighlevel.com/support/solutions/articles/155000007327-agency-dashboard-summary-tab)
- [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- Installed Next.js 16.3.2 authentication guide:
  `node_modules/next/dist/docs/01-app/02-guides/authentication.md`
- Existing implementation: `lib/console/data.ts`,
  `app/console/[venue]/live-refresh.tsx`, `lib/supabase/server.ts`, `proxy.ts`,
  `app/sign-in/actions.ts`, and `app/auth/confirm/route.ts`.

# Peregrine Office founder workspace

The private CRM at `/owner` targets **Peregrine Internal**. Client bookings and
customer CRM remain in a separate project.

| Project            | Ref                    | Stores                                                                                                                           |
| ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Peregrine Internal | `baylhrwroxnzrejslpwm` | Founder identities, outreach, agency clients, activities, follow-ups, tools, service records, manual billing and import receipts |
| Clients - Booking  | `pzljcmcnthzklaurzxpa` | Client identities, venue membership, bookings, floor plans and customer CRM                                                      |

Both projects are in Sydney. Founder access requires an approved platform-owner
record, active internal workspace membership and an `aal2` session. A venue owner
role does not grant founder access.

## Database setup

Follow [the internal database guide](../internal-db/README.md). Its independent
baseline is applied as `20261006053822`. Use `--workdir internal-db` for Supabase
CLI commands and verify the project ref before applying a migration. Root
`supabase/migrations` is reserved for the client booking project. Nine historical
founder migrations are archived under `supabase/legacy-owner/migrations`; applied
client migration history has not been rewritten. Reconcile that legacy history
and the earlier booking baseline before automated database pushes.

All fourteen internal tables were copied with IDs, timestamps, versions,
attribution, original research and retry receipts intact. Complete-row digests and
counts match the source. Foreign-key relationships and RLS were verified. No guest
or booking tables were copied. One approved founder's password hash and email
identity were migrated, excluding old sessions, refresh tokens and authenticator
secrets. The founder must sign in and enrol a new authenticator in the internal
project. Existing client accounts and their MFA remain unchanged.

The old internal copy is retained pending live founder acceptance and retirement.
[The retirement operation](../supabase/operations/retire-internal-crm.sql) is saved
for review and has not run live. Reconcile source changes and preserve a private
rollback export first. It removes only internal CRM tables and functions, retaining
booking/customer tables, client identities, venue memberships and migration history.

## Application configuration

Founder configuration uses these public browser names:

```
NEXT_PUBLIC_PEREGRINE_INTERNAL_SUPABASE_URL
NEXT_PUBLIC_PEREGRINE_INTERNAL_SUPABASE_PUBLISHABLE_KEY
```

They are configured for the CRM branch preview and local development. Existing
`NEXT_PUBLIC_BookingStorage_*` configuration remains dedicated to bookings.
Exact namespaces prevent another database from replacing the booking connection.
Founder reads never fall back to the booking project. Each project has its own
cookies and browser client. The application uses no service-role key.

`/sign-in?next=/owner` selects internal sign-in; `/console` selects client sign-in.
A booking login can return to an owner page through `project=booking`, but routing
never grants founder or venue access. Founder sign-out ends only the internal
session. Client sign-out ends only the booking session. Every protected read and
mutation rechecks access in addition to the proxy's optimistic checks.

Booking reports use a separate verified booking session, MFA and existing venue
RLS. `crm_booking_links` stores approved remote venue IDs without guest data.
Registering a connection does not grant booking access. New connections require
administrative registration. Missing booking access leaves the CRM usable and
offers client booking sign-in. Customer CRM remains at `/console/<venue>/crm`.

Future founder invitations must target **Peregrine Internal**. The two additional
founders remain uninvited pending email-sender and invitation setup. Each founder
chooses their own password and authenticator. Never commit identities, workbook
data or credentials.

## Validation and launch gates

33 native tests, scoped types and feature lint pass. The internal disposable SQL
suite verifies authorization, MFA, revocation, retries, conflicts and full imports
without booking tables. The historical suite separately covers the client CRM.
Source-retirement checks run only on the disposable engine, never live test data.

Live acceptance still requires migrated-founder sign-in and new MFA, record edits
and reconnects, client reports through both sessions, Jenny's existing console and
the other founders' independent accounts and simultaneous edits. Source retirement
and production promotion remain gated by acceptance. Reconcile source changes
before retirement; never silently merge two independently edited copies.

The advisor's private retry table has RLS and no client read policy by design.
Existing guarded security-definer mutation RPCs validate MFA, workspace access,
attribution and record versions; helper execution and direct writes are revoked.
See [Supabase RLS guidance](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
and [privileged-function guidance](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
The new project's default leaked-password protection setting remains disabled.

Services and billing are manual records. Customer CRM offers booking-derived
profiles, notes and dated tasks, with the latest 100 detail entries. Inboxes,
campaigns, payment collection and advertising/analytics connectors remain future
work. No messages or payments are sent by notes or tasks.

Older acceptance details are preserved in the
[archived single-project guide](legacy-owner-dashboard-setup.md).

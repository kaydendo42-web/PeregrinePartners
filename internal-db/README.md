# Peregrine Internal

Supabase project `baylhrwroxnzrejslpwm` stores the founder CRM and founder sign-in.
Its independent migration chain is `supabase/migrations` under this directory.
Run Supabase CLI commands with `--workdir internal-db` and verify the project ref
before applying any migration. Never apply this chain to Clients - Booking.

The baseline recreates the existing CRM contracts, with approved external venue
IDs in `crm_booking_links` instead of foreign keys to client booking tables.
It contains no bookings, guest records, client customer notes or client logins.
Workspace, catalogue, membership and historical records are restored separately
with their original IDs. Auth users retain their password hashes and email
identities; old sessions, refresh tokens and authenticator secrets are excluded.
Founders must sign in and enrol two-step verification in the internal project.

The application selects each project explicitly. Founder routes use the internal
project; `/console` and client customer CRM use Clients - Booking. Booking reports
require a separate booking-project session, MFA and existing venue membership.
No service-role key or client data replication is used for reports. Registering a
new venue connection is an administrative operation; a connection does not grant
booking access.

Preview environment names:

```
NEXT_PUBLIC_PEREGRINE_INTERNAL_SUPABASE_URL
NEXT_PUBLIC_PEREGRINE_INTERNAL_SUPABASE_PUBLISHABLE_KEY
```

These are public browser configuration. Existing `NEXT_PUBLIC_BookingStorage_*`
variables remain dedicated to client bookings. Production configuration and
promotion remain separate from the CRM preview review.

## Verification

```
CRM_TEST_ENGINE=/absolute/path/to/pglite/dist/index.js node internal-db/tests/run-local.mjs
```

The disposable engine runs the existing CRM authorization, mutation, import,
retry and conflict suites against a database with no booking tables, plus
cross-workspace and two-step checks for approved venue IDs. It never connects to
a live Supabase project.

## Migration status, 6 October 2026

The baseline is applied as `20261006053822`. Fourteen internal tables were copied
and reconciled by count and complete-row digests: 4,311 businesses (4,310 outreach
leads and one agency client), 1,253 contacts, 1,260 activities, five catalogue tools,
one import receipt, 4,431 original import rows, three retry receipts, one workspace
and one founder. All foreign-key relationships and RLS were verified. The source
client database retains its eight bookings and its two existing auth users.

The old internal copy is retained pending founder sign-in acceptance and source
retirement. Do not treat it as a second active CRM after cutover. Before retiring
it, reconcile changes made during review and preserve a private rollback export.
Do not delete booking/customer tables, client identities or venue memberships.
Invitation sending remains pending email setup; future founder invitations belong
to this internal project.

Historical mixed-project owner migrations are archived under
`supabase/legacy-owner/migrations` for audit and rollback review. They must not be
installed into another client booking project. Applied client migration history
has not been rewritten; reconcile that legacy history before automated database
pushes.

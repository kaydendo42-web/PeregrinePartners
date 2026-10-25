# Peregrine Office console: setup

The console lives at `www.peregrinepartners.space/console`, in this repo
(`kaydendo42-web/PeregrinePartners`, Vercel project `peregrine-partners`).
The bare `peregrinepartners.space` redirects to `www`, so every URL Supabase
is given uses `www`. A client signs in at
`/sign-in` and lands on their own venue's diary. One Supabase project holds
every client; row-level security keeps each venue's rows to its own members.

Approved founders now have a separate `/owner` workspace. After its additive
database setup, their default sign-in lands there; an explicit venue-console
destination remains available. Client accounts keep their venue destination.
A venue `owner` role does not grant founder access. See
[Founder workspace setup](owner-dashboard-setup.md) for the migration order,
private owner bootstrap, two-step verification and launch checks.

```
guest ─▶ thepeacock.com.au/book-a-table ─▶ /api/booking (server, service key) ─┐
                                                                               ▼
                                                         Supabase (Sydney): bookings
                                                                               ▲
Jenny ─▶ peregrinepartners.space/sign-in ─▶ /console/the-peacock (her session, RLS)
```

## One-time setup

1. **Create the Supabase project** (Vercel → Storage/Marketplace → Supabase,
   region Sydney). Connecting it to the Peregrine Vercel project sets
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for us.
2. **Run the schema**: SQL editor → paste
   `supabase/migrations/20260930000000_bookings.sql` → run.
3. **Register The Peacock**: paste `supabase/seed/peacock.sql` → run.
   (Regenerate it from the Peacock repo with `npm run peregrine:seed` whenever
   a table moves.)
4. **Give Jenny a login**: Authentication → Users → Add user → her email and a
   password (tick "auto confirm"). Then in SQL:

   ```sql
   insert into venue_members (venue_id, user_id, role)
   select 'fb19b599-8b90-4576-b84a-1ff0f4eb1f7e', id, 'owner'
   from auth.users where email = 'jenny@…';
   ```

   Do the same for us (role `manager`) so we can support her.
5. **Point the Peacock site at it** (Peacock Vercel project, Production env):
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server-only, never
   `NEXT_PUBLIC_`), `PEREGRINE_VENUE_ID=fb19b599-8b90-4576-b84a-1ff0f4eb1f7e`.
   Redeploy. From then on web bookings go to Supabase instead of Upstash.
6. **Auth URLs**: Supabase → Authentication → URL configuration → Site URL
   `https://www.peregrinepartners.space`; redirect URLs
   `https://www.peregrinepartners.space/auth/confirm`,
   `https://*-kaydendo42-webs-projects.vercel.app/auth/confirm` (previews) and
   `http://localhost:3000/auth/confirm`. Only email links need these;
   password sign-in works without them.

## Working on it locally

`PEREGRINE_CONSOLE_DEMO=1 npm run dev`, then `/console/the-peacock`: the whole
console on sample Peacock bookings, no database. Never set that variable on
Vercel.

## Adding the next client

A new row in `venues`, its `sections` and `venue_tables`, and a
`venue_members` row per person. No new Vercel project, no new database. Their
own website (if we build it) gets the same three env vars with its venue id.

## Cutover from Resos

1. Pick the day. Export Resos's future bookings (List → export CSV).
2. In the Peacock repo: `npm run peregrine:import -- export.csv` (dry run),
   check the notes it prints, then add `--commit`.
3. Point the website's Book buttons and her Google Business Profile booking
   link at `thepeacock.com.au/book-a-table`.
4. Keep Resos paid until the last imported booking has passed, so guests'
   existing Resos confirmation links still work. Check Resos for any
   cancellations made through those links in that window.

## What's built, what isn't

Built: sign-in (password or email link), Dashboard, Calendar, Schedule, List
(seat / no-show / cancel / reinstate), Floor plan at any time, Customers, New
booking (phone / walk-in), live refresh when a web booking lands.

Not yet: editing a booking's time or table, SMS, waitlist, reports, venue
settings editable by the client, Reserve with Google.

## Tablet and remembered-session rollout (25 October 2026)

The client console is now reached at `https://www.peregrineoffice.space/console`.
The older Peregrine Partners domain redirects there. This repo and the public
Peacock website remain separate deployments.

The sign-in form offers an unchecked **Keep me signed in for 30 days** option.
Checked uses a fixed cookie deadline; unchecked uses browser-session cookies
(browser session restore is controlled by the browser). Server, proxy and
browser SDK refreshes share the same preference per Supabase project. Returning
users go into their workspace using their existing session. New or expired
sessions follow the existing MFA and membership checks; this is not an MFA
bypass. Signing out affects the current session/device and project only.
Existing sessions keep their previous cookie policy until their next sign-in.

### Required provider setting before production release

A cookie preference alone is not a provider-enforced lifetime limit. In
Supabase Authentication → Sessions, verify plan support (Pro or higher) and
set **Time-box user sessions** to **30 days / 720 hours** for each auth project
used by this deployment: the booking/client project and, when configured, the
independent internal/founder project. Preserve the current short JWT lifetime,
MFA policies and RLS. Record the current values before changing them.

This is a project-wide ceiling, including barber shops in the shared booking
project. Existing sessions age from their original creation time; ones already
older than 30 days will need to sign in on the next refresh. Supabase enforces
the ceiling at refresh time, so the normal remaining JWT lifetime also applies.
Do not change this production setting merely to test a preview. If a project's
plan does not support the setting, record that limitation before claiming a
strict 30-day provider cutoff. Provider settings have not been changed by this
branch.

Read-only inspection on 25 October confirmed both configured projects are on
Free plans: booking `pzljcmcnthzklaurzxpa` and internal
`baylhrwroxnzrejslpwm`. Both show time-box and inactivity timeout `0`
(unlimited), a 3600-second JWT expiry, refresh-token replay protection on,
and a 10-second reuse interval. The session time-box controls are disabled
until Pro. The browser preference can be previewed now; a strict provider
cutoff remains unavailable on these plans. No upgrade was made.

### Verification

Use `PEREGRINE_CONSOLE_DEMO=1` locally with no Supabase credentials for the
booking UI. The seed parser supports the current `thepeacock` schema. Never
set demo mode on a hosted deployment. Test password, email-link and founder
fallback login with checked/unchecked preferences; verify MFA, reload/refresh,
local sign-out, password recovery and independent project sessions. The email
preference applies when the link opens in the same browser that requested it.
A link opened in another browser, or a password-recovery link, starts a
browser-session cookie policy unless an explicit pending choice is present.

Verify 768×1024, 820×1180, 1024×768 and 1280×800 layouts, plus phone and desktop.
Open/close the tablet menu with touch and Escape, then check booking actions,
new/edit forms, dinner collection, calendar, customer records, timeline and
floor scrolling. Use demo records for status or assignment interactions.


Branch verification: 81 automated tests passed, route type generation and
TypeScript passed, changed-file ESLint passed, and `npm run build -- --webpack`
passed. The full lint command still reports two existing set-state-in-effect
errors in `components/art/screen-face.tsx` and
`components/platform/floor-boot.tsx`, plus four existing image warnings.
The Impeccable source detector reported no findings on the changed UI.

Browser checks used fictional local data and no Supabase credentials. The
booking list fits at 375, 768, 820, 1024, 1280 and 1440px, with 44px actions
inside the document width. Portrait and landscape checks covered menu
opening/closing (including Escape and focus return), new/edit forms, populated
dinner rows with long contact details, calendar, customers, notification
settings, and labelled floor/timeline scroll regions. The sign-in checkbox
starts unchecked and carries its value when switching to email-link mode.
No real booking or payment was changed. These are viewport checks, not a
physical-tablet test. Authenticated password/MFA/email/recovery smoke tests
against a hosted preview remain a release check; adapter regression tests
cover recovery callbacks, expiry, local sign-out and deleted cookie chunks.

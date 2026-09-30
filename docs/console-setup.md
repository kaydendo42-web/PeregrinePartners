# Peregrine console: setup

The console lives at `www.peregrinepartners.space/console`, in this repo
(`kaydendo42-web/PeregrinePartners`, Vercel project `peregrine-partners`).
The bare `peregrinepartners.space` redirects to `www`, so every URL Supabase
is given uses `www`. A client signs in at
`/sign-in` and lands on their own venue's diary. One Supabase project holds
every client; row-level security keeps each venue's rows to its own members.

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

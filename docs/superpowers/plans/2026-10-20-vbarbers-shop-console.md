# V Barbers Shop Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vance signs in to PeregrineOffice and runs his shop day to day: sees who's coming, books and blocks time, and sets his hours, days off, services and booking rules. His public booking page (vbarbers.vercel.app) follows those settings live.

**Architecture:** Three parts. (1) An additive migration in the `vbarbers` schema adds shop memberships, booking-rule columns, member RLS gated on two-step (aal2) like the venue tables, and an atomic RPC for weekly hours. (2) The V Barbers app stops reading services, hours, closures and rules from `src/config/tenant.ts` and loads them from the database, with `tenant.ts` as the local/file fallback. (3) The PeregrineOffice console gains a second kind of client, a *shop*, under `/console/shop/[slug]`, laid out as a phone-first Booksy-style skeleton: Calendar, Working hours, Time off, Services, Settings. It talks to `vbarbers` directly with the signed-in member's session.

**Tech Stack:** Next.js 16 App Router (both apps; read `node_modules/next/dist/docs/` before writing Next code), React 19, Supabase (PostgREST + Auth + Realtime) via `@supabase/ssr` in the console and plain `fetch` in V Barbers, Postgres 17, `node --test` with `--experimental-strip-types`.

**Spec (agreed in conversation, 2026-10-20):**
- Vance's daily use, in his words: "logs in and checks who's coming, sets his availability for the future". Guests can book 3 weeks ahead (already live in V Barbers).
- The dashboard every client sees should work like Booksy's at the skeleton (same screens, same flow, things where a Booksy user expects them) so moving over is seamless. Peregrine's own look and the client's personal branding on the booking page are the difference. Workflows only: no copied Booksy code, assets or visual design, and no reverse engineering of Booksy's app.
- Booksy's management basics, from its public material: a calendar of appointments, working hours, days off and blocked time, closures and special hours for specific dates, and a "booking for future" window.
- It lives in the existing PeregrineOffice console (installable PWA, Supabase Auth with two-step), not in V Barbers' own `/owner` page.

**Repos:**
- `PV` = `/Users/kaydendo/Documents/Projects/Peregrine Clients/Vbarbers` (GitHub jye230606-bot/peregrinebooking-barbers). Work on branch `schedule-from-db`, created from `vbarbers-schema-and-hero`.
- `PP` = worktree `/Users/kaydendo/Documents/Projects/Peregrine Partners V2-shop`, branch `shop/vbarbers-console` (GitHub kaydendo42-web/PeregrinePartners).

## Global Constraints

- Database: project Clients - Booking `pzljcmcnthzklaurzxpa`, schema `vbarbers` only. Additive changes only: no `drop`, `rename` or `alter column`. Never touch `thepeacock` or `public`.
- Every member-facing `vbarbers` table gets a restrictive policy `"two-step sign-in required"`, `using ((select auth.jwt() ->> 'aal') = 'aal2')`, the same as `PP/supabase/migrations/20261005000000_require_two_step.sql`.
- V Barbers' public API keeps using the service role. The browser never talks to Supabase from V Barbers (`tests/content.test.mjs` "no secret is exposed" must still pass).
- Times are Australia/Melbourne wall clock. Date keys are `YYYY-MM-DD`, times `HH:MM`, weekday 0 = Sunday.
- Rule values seeded for V Barbers: slot 45 min, buffer 0, notice 120 min, advance 21 days, guest change cutoff 12 h.
- Console copy: plain, short, sentence case. Shop nav labels exactly `Calendar`, `Hours`, `Time off`, `Services`, `Settings`.
- Colours in V Barbers CSS only via tokens (existing test). Console styles go in `PP/app/console/shop/shop.css` and use the console's existing CSS variables.

## Review Focus

1. **Vance edits hours while a guest is mid-booking.** The guest's POST must be re-checked against the hours in force *now*: the server re-reads the schedule, it isn't cached past 60 s, and the slot is refused with `outside-hours`. Test in Task 3.
2. **Owner books over an existing appointment or a block.** The console must show "That time is taken" (Postgres 23P01 from `bookings_no_overlap`), or "That's in blocked time" from the console's own pre-check, and never a raw error. Test in Task 7.
3. **Closing a day that already has bookings.** Saving a closure must not cancel or hide existing bookings. The calendar still lists them, and the Time off form warns "N bookings that day stay booked". Test in Task 9.
4. **Weekly hours saved half-way.** A network drop between delete and insert must not leave Vance with no hours. `vbarbers.set_weekly_hours` replaces all seven days in one transaction. Test in Task 1 (SQL) and Task 8.
5. **An aal1 session (password only) hitting the API directly.** RLS returns nothing. Test in Task 1 via `store:check`'s new member section.

---

### Task 1: vbarbers memberships, rule columns, member RLS and hours RPC

**Files:**
- Create: `PV/supabase/migrations/20261020100000_vbarbers_members.sql`
- Modify: `PV/supabase/seed.sql` (set the rule columns on the `vbarbers` tenant row)
- Modify: `PV/tests/content.test.mjs` (the migration test reads every file in `supabase/migrations`, not just the first)
- Modify: `PV/scripts/check-store.mjs` (add a member/RLS section)

**Interfaces:**
- Produces, in schema `vbarbers`:
  - Columns on `tenants`: `slot_minutes int not null default 45 check (slot_minutes in (15,30,45,60))`, `buffer_minutes int not null default 0 check (buffer_minutes between 0 and 60)`, `min_notice_minutes int not null default 120 check (min_notice_minutes between 0 and 2880)`, `max_advance_days int not null default 21 check (max_advance_days between 1 and 180)`, `guest_change_cutoff_hours int not null default 12 check (guest_change_cutoff_hours between 0 and 168)`.
  - `members (tenant_id uuid references vbarbers.tenants(id), user_id uuid references auth.users(id) on delete cascade, role text not null default 'owner' check (role in ('owner','staff')), created_at timestamptz default now(), primary key (tenant_id, user_id))`.
  - `is_member(t uuid) returns boolean`: `security definer`, `stable`, `set search_path = pg_catalog, vbarbers`, true when a `members` row matches `auth.uid()`.
  - `set_weekly_hours(t uuid, days jsonb) returns void`: `security invoker`. `days` is an array of `{weekday, open, close}`. It deletes then inserts the tenant's `weekly_hours` in one call, and raises `'not a member'` unless `is_member(t)`.
  - Grants to `authenticated`: usage on the schema; `select, update` on `tenants`; `select, insert, update, delete` on `services, weekly_hours, date_overrides, blocks`; `select, insert, update` on `customers, bookings`; `select` on `reviews, members`; execute on both functions.
  - Policies for `authenticated`: permissive `is_member(tenant_id)` (or `is_member(id)` on `tenants`, `user_id = auth.uid()` on `members`) for each granted command, plus the restrictive aal2 policy on all nine tables.
  - `alter publication supabase_realtime add table vbarbers.bookings, vbarbers.blocks`.

- [ ] **Step 1: Write the failing test.** In `tests/content.test.mjs`, add `test("every vbarbers table is member-only and needs two-step", …)`. Read all migration files, concatenated. For each of `tenants services weekly_hours date_overrides blocks customers bookings reviews members`, assert a match for `create policy "two-step sign-in required" on vbarbers\.${t}\s+as restrictive`. Assert `/create function vbarbers\.set_weekly_hours/`, and assert no `\bpublic\.` or `\bthepeacock\.`. Change the existing migration test to loop over every file instead of `const [file]`.
- [ ] **Step 2: Run it to make sure it fails.** `npm test`. Expected: FAIL on the new test.
- [ ] **Step 3: Write the migration** with exactly the interfaces above. In `seed.sql`, add `update vbarbers.tenants set slot_minutes=45, buffer_minutes=0, min_notice_minutes=120, max_advance_days=21, guest_change_cutoff_hours=12 where slug='vbarbers';`.
- [ ] **Step 4: Run tests.** `npm test`. Expected: all pass.
- [ ] **Step 5: Dry-run on live** inside `begin; … rollback;` with `supabase db query --linked --project-ref pzljcmcnthzklaurzxpa -f <file>`. End it with a select that returns the policy count on `vbarbers` (expected ≥ 18) and `vbarbers.is_member('00000000-0000-0000-0000-000000000000')` = false. Expected: no error, and the schema is unchanged afterwards.
- [ ] **Step 6: Apply.** Wrap the file in `begin; … commit;` and save it to `Peregrine Office/ops/2026-10-20-vbarbers-members/1-apply.sql` for Kayden to run if auto mode refuses. Then run the seed `update`.
- [ ] **Step 7: Extend `check-store.mjs`.** It creates a throwaway auth user with the service role (`POST /auth/v1/admin/users`), adds it to `members` of the `vbarbers-selftest` tenant, signs in with password (aal1), and asserts `GET /rest/v1/bookings` returns `[]` with profile `vbarbers`. It deletes the user in `finally`. Run `npm run store:check`. Expected: the new line `✔ a password-only session reads nothing`.
- [ ] **Step 8: Commit** `Add shop members, booking rules and member-only RLS to vbarbers`.

### Task 2: Store loads the shop's schedule

**Files:**
- Create: `PV/src/booking/schedule.ts`
- Modify: `PV/src/booking/server/store.ts`, `supabaseStore.ts`, `fileStore.ts`
- Test: `PV/tests/supabase.test.mjs` (fake PostgREST learns `tenants?select=…`, `services`, `weekly_hours`, `date_overrides`)

**Interfaces:**
- Produces:
  - `export type Schedule = Pick<TenantConfig, 'services' | 'weeklyHours' | 'overrides' | 'rules'>` in `schedule.ts`.
  - `export function withSchedule(base: TenantConfig, s: Schedule | null): TenantConfig`. It returns `base` when `s` is null.
  - `BookingStore.loadSchedule(): Promise<Schedule | null>`. The file store returns `null`.
- Consumes: Task 1's columns.

- [ ] **Step 1: Failing test.** `test("the schedule comes from the database")`. Fake rows: two services (one `active:false`), weekly_hours for weekdays 2–6 with `open_local:'10:00:00'`, one override `{date:'2026-11-05', closed:true}`, and the tenant's five rule columns. Assert:
  - `services.length === 1`;
  - `weeklyHours[0] === null`, `weeklyHours[2]` deep-equals `['10:00','18:15']`;
  - `overrides[0]` deep-equals `{date:'2026-11-05', closed:true}`;
  - `rules.slotMinutes === 45`, `rules.maxAdvanceDays === 21`.
  - Every call carries `Accept-Profile: vbarbers`.
- [ ] **Step 2: Run.** Expected: FAIL, `loadSchedule is not a function`.
- [ ] **Step 3: Implement.** `supabaseStore.loadSchedule` makes four parallel GETs scoped to the tenant id. It drops seconds from `time` values, keeps overrides with `date >= todayKey()`, and orders services by `sort`. A weekday with no row is `null`; with several rows, the earliest open and latest close.
- [ ] **Step 4: Run.** `npm test`. Expected: pass.
- [ ] **Step 5: Commit** `Load services, hours, closures and rules from the store`.

### Task 3: Server uses the live schedule

**Files:**
- Modify: `PV/src/booking/server/config.ts`, `PV/src/booking/server/api.ts`, `PV/src/booking/server/email.ts`, `PV/src/booking/ics.ts`
- Test: `PV/tests/api.test.mjs`

**Interfaces:**
- Produces: `export async function tenantConfig(store: BookingStore, now = Date.now()): Promise<TenantConfig>`. It caches `withSchedule(tenant, await store.loadSchedule())` per store for 60 000 ms. `handle(req, config)` resolves it once per request and passes it to every `rules.ts` call and message string in place of the imported `tenant`.
- Consumes: Task 2.

- [ ] **Step 1: Failing test** `test("a schedule change is enforced on the next booking")`. The store's `loadSchedule` returns Tuesday hours `['12:00','18:15']`. Assert that booking `10:00` on `TUESDAY` returns `outside-hours` and `12:00` returns 201. Advance the cache clock with `t.mock.timers` by 61 s, then switch the schedule back to 10:00 and assert `10:00` books.
- [ ] **Step 2: Run.** Expected: FAIL (10:00 books).
- [ ] **Step 3: Implement.** No module imports `tenant` for services, hours, overrides or rules any more; brand fields (name, address, instagram, payment) stay on the static `tenant`.
- [ ] **Step 4: Run.** `npm test`. Expected: all 46+ pass.
- [ ] **Step 5: Commit** `Enforce the schedule in force now, re-read every minute`.

### Task 4: Public page and booking sheet use the live schedule

**Files:**
- Create: `PV/src/components/TenantContext.tsx`
- Modify: `PV/src/app/page.tsx` (`revalidate = 60`), `PV/src/app/booking/[id]/page.tsx`, `PV/src/app/layout.tsx`, `PV/src/components/{BookingFlow,Pickers,Hours,Hero,Info,ManageBooking,copy}.tsx|ts`
- Test: `PV/tests/content.test.mjs`

**Interfaces:**
- Produces: `TenantProvider({ value: TenantConfig, children })` and `useTenant(): TenantConfig` (throws outside a provider). The pages call `tenantConfig(config().store)` on the server and wrap their tree in the provider.
- Consumes: Task 3's `tenantConfig`.

- [ ] **Step 1: Failing test.** A source scan asserting that no file under `src/components` reads `tenant.services`, `tenant.weeklyHours`, `tenant.overrides` or `tenant.rules`, and that `src/app/page.tsx` exports `revalidate = 60`.
- [ ] **Step 2: Run.** Expected: FAIL listing the files.
- [ ] **Step 3: Implement.** Components take schedule fields from `useTenant()` and pass `cfg` into `gridStarts`, `bookingWindow` and `openingOn`.
- [ ] **Step 4: Verify.** `npm test` passes. Run `npm run dev` with `STORE=file`: the page renders with the hero sub-line "2 services from $50 · Tue–Sat", and the booking sheet offers 11 spots on a Tuesday.
- [ ] **Step 5: Commit** `Render hours, services and slots from the live schedule`.

### Task 5: Console knows about shops

**Files:**
- Create: `PP/lib/console/clients.ts`, `PP/lib/shop/data.ts`, `PP/lib/shop/types.ts`
- Modify: `PP/lib/supabase/server.ts` (an optional schema), `PP/lib/supabase/environment.ts`, `PP/app/console/page.tsx`
- Test: `PP/tests/shop/clients.test.ts`; `PP/package.json` test glob becomes `tests/crm/*.test.ts tests/shop/*.test.ts`

**Interfaces:**
- Produces:
  - `supabase(project?: SupabaseProject, opts?: { schema?: string })`, defaulting to `schemaFor(project)`.
  - `export const SHOP_SCHEMA = "vbarbers"` in `environment.ts`.
  - `export type ClientRef = { kind: "venue" | "shop"; slug: string; name: string; href: string }`.
  - `export async function myClients(): Promise<ClientRef[]>`: venues from `myVenues()` (href `/console/${slug}`) plus shops from `vbarbers.members` joined to `tenants` (href `/console/shop/${slug}`), sorted by name.
  - `export function pickDestination(clients: ClientRef[]): string | null`: one client gives its href, otherwise null.
  - In `lib/shop/types.ts`: `Shop = { id; slug; name; timezone; slotMinutes; bufferMinutes; minNoticeMinutes; maxAdvanceDays; guestChangeCutoffHours }`, `ShopService = { id; name; durationMin; priceCents; active; sort }`, `ShopBooking = { id; serviceId; serviceName; startsAt; endsAt; status: 'confirmed'|'cancelled'|'completed'|'no_show'; priceCents; notes; source: 'web'|'owner'; customer: { id; name; phone; email } }`, `ShopBlock = { id; startsAt; endsAt; reason }`, `WeeklyHours = ([string, string] | null)[]`, `DayOverride = { id; date; closed; open: string|null; close: string|null; note: string|null }`.
  - In `lib/shop/data.ts`: `shopBySlug(slug): Promise<Shop>` (`notFound()` when it isn't the member's) and `shopClient()` (the `vbarbers`-schema server client).
- [ ] **Step 1: Failing test.** `pickDestination` returns the href for exactly one client and null for zero or two. Sorting puts "The Peacock South Yarra" before "V Barbers".
- [ ] **Step 2: Run** `npm test`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement.** `/console` uses `myClients()` and `pickDestination()`. The picker lists both kinds with a small "Venue" or "Barber" label.
- [ ] **Step 4: Run** `npm test`, `npx tsc --noEmit` (ignore generated `PageProps`/`LayoutProps` noise before a build), `npx eslint lib app/console`. Expected: clean.
- [ ] **Step 5: Commit** `Let a console member belong to a barber shop as well as a venue`.

### Task 6: Shop frame and Calendar (who's coming)

**Files:**
- Create: `PP/app/console/shop/[slug]/layout.tsx`, `page.tsx` (Calendar), `nav.tsx`, `booking/[id]/page.tsx`, `actions.ts`, `PP/app/console/shop/shop.css`, `PP/lib/shop/day.ts`
- Test: `PP/tests/shop/day.test.ts`

**Interfaces:**
- Produces:
  - `dayBounds(date: string, tz: string): { from: Date; to: Date }`.
  - `layoutDay(bookings: ShopBooking[], blocks: ShopBlock[], hours: [string,string] | null, tz: string): { startMin: number; endMin: number; items: { id; kind: 'booking'|'block'; top: number; height: number; label: string; sub: string; status? }[] }`. Minutes since midnight, padded to the hour around opening hours and any item outside them; default 8:00–20:00 when closed and empty.
  - `shopDay(shopId, date): Promise<{ bookings: ShopBooking[]; blocks: ShopBlock[] }>` in `lib/shop/data.ts` (cancelled ones excluded).
  - Server actions in `actions.ts`: `setStatus(slug, id, status: 'cancelled'|'completed'|'no_show')`.
- Layout (Booksy skeleton, Peregrine look): on phones, a top bar with the shop name and date and a bottom tab bar `Calendar · Hours · Time off · Services · Settings`; at ≥ 900px, a left sidebar with the same items. Calendar: a week strip (Mon–Sun, today marked, arrows for previous/next week), then a single-day timeline with 15-minute grid lines, closed hours shaded, bookings as blocks (time, client name, service) and blocks as hatched bars. Tapping a booking opens `booking/[id]`: name, service, time, price, notes, a `tel:` call link and an `sms:` link, and buttons **Completed**, **No-show**, **Cancel appointment** (with a confirm step on the page, not `window.confirm`). A floating **+** opens Task 7's sheet. Live updates via the existing `LiveRefresh` pattern on `vbarbers.bookings` filtered `tenant_id=eq.<id>`.

- [ ] **Step 1: Failing tests.** In `day.test.ts`:
  - a 10:00–10:45 booking with hours `['10:00','18:15']` gets `top` = 0 relative to `startMin` 600 and `height` = 45;
  - `endMin` = 1140 (18:15 rounded up to 19:00);
  - a 20:00 owner booking extends `endMin` to 1260;
  - on a DST-change day (`2026-10-04`, tz Australia/Melbourne), `dayBounds` spans 23 hours.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** `day.ts`, the data functions, the frame and the Calendar page.
- [ ] **Step 4: Verify.** `npm test` passes. `next build` succeeds and lists `/console/shop/[slug]`. In a browser at 390px wide, signed in as the test member from Task 10 (or the console's demo mode if `demoOn()` covers shops; if not, use a seeded booking), the day shows the seeded bookings at the right times.
- [ ] **Step 5: Commit** `Add the shop calendar: who's coming, by day`.

### Task 7: New appointment and block time

**Files:**
- Create: `PP/app/console/shop/[slug]/new/page.tsx`, `PP/app/console/shop/[slug]/new/form.tsx`, `PP/lib/shop/booking.ts`
- Modify: `PP/app/console/shop/[slug]/actions.ts`
- Test: `PP/tests/shop/booking.test.ts`

**Interfaces:**
- Produces:
  - `planBooking(input: { service: ShopService; date: string; time: string; tz: string; bufferMinutes: number }, existing: ShopBooking[], blocks: ShopBlock[]): { ok: true; startsAt; endsAt; blockedUntil } | { ok: false; error: string }`. The owner may book any 15-minute start and outside hours (Booksy lets the owner override).
  - Server actions `createAppointment(slug, form)` and `createBlock(slug, form)`.
- Behaviour: the sheet has two tabs, **Appointment** (service, date, time, client name and mobile, optional email and notes) and **Block time** (date, from, to, reason). The appointment upserts `customers` on `(tenant_id, phone)` with E.164 phone normalisation, the same rules as V Barbers' `normalisePhone`, ported. It then inserts `bookings` with `source:'owner'`, `price_cents_snapshot` from the service, and `status:'confirmed'`.
  - Postgres `23P01` maps to "That time is taken."
  - A clash with a block maps to "That's in blocked time."
  - A block over a confirmed booking is refused: "There's an appointment in that time."
- [ ] **Step 1: Failing tests.** In `booking.test.ts`:
  - `planBooking` for Haircut at 10:00 against an existing 10:00–10:45 returns `{ok:false, error:'That time is taken.'}`;
  - against a 10:30–11:00 block it returns `"That's in blocked time."`;
  - at 10:45 it returns `ok` with `endsAt` 11:30;
  - `0412 345 678` normalises to `+61412345678`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Verify.** `npm test` passes. On the live preview with the test member, create and then cancel an appointment. The public site's availability for that slot disappears, then returns.
- [ ] **Step 5: Commit** `Book and block time from the shop calendar`.

### Task 8: Working hours

**Files:**
- Create: `PP/app/console/shop/[slug]/hours/page.tsx`, `PP/app/console/shop/[slug]/hours/form.tsx`, `PP/lib/shop/hours.ts`
- Test: `PP/tests/shop/hours.test.ts`

**Interfaces:**
- Produces: `parseHoursForm(fd: FormData): { ok: true; days: { weekday: number; open: string; close: string }[] } | { ok: false; error: string }`. It reads `day-<0..6>-on`, `day-<n>-open` and `day-<n>-close`, and refuses close ≤ open with "Closing time must be after opening on <Tuesday>." The save action calls `rpc('set_weekly_hours', { t, days })`.
- UI: seven rows, Monday first, each with an on/off switch and From/To selects in 15-minute steps from 06:00 to 22:00, then **Save hours**. Below it: "Changes show on your booking page within a minute."
- [ ] **Step 1: Failing tests.**
  - Monday off with Tuesday 10:00–18:15 parses to one day `{weekday:2, open:'10:00', close:'18:15'}`;
  - Tuesday 18:00–10:00 returns the closing-time error naming Tuesday.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Verify** on the preview: change Saturday's close to 17:00, and within 60 s `https://vbarbers.vercel.app/api/booking/availability?date=<next Sat>&service=74cdb172-7b61-5260-9f17-9e6d24c2e17d` no longer lists 16:15. Then restore 18:00.
- [ ] **Step 5: Commit** `Let the shop set its working hours`.

### Task 9: Time off

**Files:**
- Create: `PP/app/console/shop/[slug]/time-off/page.tsx`, `PP/app/console/shop/[slug]/time-off/form.tsx`, `PP/lib/shop/timeoff.ts`
- Test: `PP/tests/shop/timeoff.test.ts`

**Interfaces:**
- Produces: `expandRange(from: string, to: string): string[]`, inclusive, at most 60 days, otherwise it throws "Pick 60 days or fewer." The save action upserts `date_overrides` on `(tenant_id, date)`. Delete removes one row.
- UI: an upcoming list (date, "Closed" or "Open 12:00–16:00", note, Remove), then an **Add time off** form: From, To, "Closed all day" or "Different hours" (open/close), and a note. Before saving, it counts confirmed bookings in the range and shows "3 bookings in these days stay booked. Contact those clients if you need to move them." (Review Focus 3.)
- [ ] **Step 1: Failing tests.**
  - `expandRange('2026-11-05','2026-11-09')` has length 5;
  - across the DST change (`2026-10-03`→`2026-10-05`) it gives 3 keys;
  - 61 days throws.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Verify** on the preview: close a free test day, check the public site shows no slots that day, then remove it.
- [ ] **Step 5: Commit** `Let the shop add days off and special hours`.

### Task 10: Services, settings, and giving Vance his login

**Files:**
- Create: `PP/app/console/shop/[slug]/services/page.tsx`, `PP/app/console/shop/[slug]/settings/page.tsx`, `PP/lib/shop/settings.ts`, `PP/scripts/add-shop-member.mjs`
- Test: `PP/tests/shop/settings.test.ts`

**Interfaces:**
- Produces: `parseSettings(fd: FormData): { ok: true; value: Pick<Shop,'slotMinutes'|'bufferMinutes'|'minNoticeMinutes'|'maxAdvanceDays'|'guestChangeCutoffHours'> } | { ok:false; error:string }`. Values outside Task 1's check ranges return a field-specific error. `parseService(fd)` requires a name of 1–60 characters, a duration that is a multiple of 15 between 15 and 240, and a price ≥ 0 in dollars, converted to cents.
- Settings UI, with Booksy's wording where it helps him find things: "How far ahead clients can book" (days), "Minimum notice" (hours), "Appointment slots every" (15/30/45/60 min), "Clients can cancel or move up to" (hours before), "Gap after each appointment" (min).
- Services UI: list with name, length and price, an **Active** switch, edit in place, and **Add service**. Inactive services disappear from the public booking sheet.
- `add-shop-member.mjs --email <e> --shop vbarbers`: with the service role, it creates the auth user with a random temporary password (printed once to the terminal of whoever runs it, never logged or stored) or finds the existing one, then inserts the `members` row. At first sign-in the user sets up their authenticator (the existing two-step flow).
- [ ] **Step 1: Failing tests.**
  - `parseSettings` with advance `21` and slots `45` is ok;
  - advance `0` returns "Pick between 1 and 180 days.";
  - `parseService` price `"50"` gives 5000 cents;
  - duration `50` returns "Use steps of 15 minutes."
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Verify.** `npm test` passes, tsc and eslint are clean, `next build` passes. Open a PR from `shop/vbarbers-console`. Kayden runs `node scripts/add-shop-member.mjs --email <Vance's email> --shop vbarbers` (and once with his own email to test). Signing in on the preview lands on `/console/shop/vbarbers`, and the five tabs work at 390px.
- [ ] **Step 5: Commit** `Edit services and booking rules; script to add a shop member`.

---

## Non-goals (this plan)

- Emails from console actions (cancel notices to clients). V Barbers has no Resend key yet. Track separately.
- Client list/CRM, reports, payments, staff calendars, deposits, waitlists, reviews management.
- Changing The Peacock's console.
- Retiring V Barbers' `/owner` page (it keeps working until Vance is on the console).

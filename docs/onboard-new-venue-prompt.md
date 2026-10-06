# Onboard a new venue onto Peregrine Office bookings — copy-paste prompt

Fill in the **Venue brief** block, attach the floor plan (and venue photos if
you have them), and paste everything below the line into Claude Code, opened
in the client's website repo.

The Peacock (`kaydendo42-web/peacock-south-yarra`) is the reference build.
Everything here was done there first.

---

You are adding Peregrine's floor-plan booking system to a new client venue.
Guests will book a specific table on a 3D isometric model of the real venue on
the client's website; the owner will run the diary from the Peregrine console
at peregrinepartners.space/console. Both read and write one shared Supabase
database. Work through the phases in order, verify each before moving on, and
ask me only for things you genuinely cannot get from the brief, the plan, or
the reference repo.

## Venue brief

```
Venue name:            <e.g. The Peacock South Yarra>
Slug:                  <e.g. the-peacock>         (URL-safe, permanent)
Booking-ref prefix:    <e.g. PK>                  (two letters; refs look like PK-7QK2MD)
Timezone:              <e.g. Australia/Melbourne>
Phone:                 <e.g. 03 8596 2342>
Website repo:          <github owner/repo>         (or "new site")
Website URL:           <https://…>
Opening hours:         <weekdays open–close; weekends open–close; public holidays>
Sitting length:        <e.g. 75 min, 90 for 5+; 15 min turnaround>
Largest online party:  <e.g. 8 — bigger groups call>
Sections (as the owner names them, and indoor/outdoor):
  - <Court Yard — outdoor>
  - <Main — indoor>
Levels:                <which sections are raised/lowered, where the steps are; "unknown" is fine>
Owner login email(s):  <…>
Previous system:       <e.g. Resos — will export a CSV of future bookings at cutover>
Floor plan:            attached (<filename>) — table numbers must match what staff call them
Scale reference:       <a dimension printed on the plan, e.g. "1770 under the banquette spans 160 px">
Photos:                <attached / none>
```

## Reference: what already exists

Read these before writing anything.

- **Booking module** (copy it, don't rewrite it): in the Peacock repo,
  `src/booking/` (data, scene, components, server), `src/app/api/booking/[...route]/route.ts`,
  `src/app/booking.css`, `src/app/book-a-table/page.tsx`, `tests/booking-*.test.mjs`,
  `scripts/peregrine-seed.mjs`, `scripts/import-bookings.mjs`. Its conventions are
  in the Peacock `CLAUDE.md` and `docs/BOOKING_SYSTEM.md`.
- **Console + schema**: the Peregrine repo — `supabase/migrations/20260930000000_bookings.sql`
  (already applied to the shared project; do **not** run it again), `app/console/`,
  `lib/console/`, `docs/console-setup.md`.
- **Art direction** for the room (keep it — it's Peregrine's signature):
  orthographic camera at equal XYZ, 90°-snapped rotation, no lights, flat
  three-value face shading with the dark side fixed on screen, hard edges,
  arches/crenellations/slits, faceted plants, the site's own palette. Nothing
  under `src/booking/` uses a PerspectiveCamera, lit materials, box-shadow,
  backdrop-filter or radius above 3px. Rotation is baked into geometry
  (`orientedBoxGeo`, `wallGeo(turns)`) — never rotate a shaded mesh.

## Phase 1 — trace the floor plan into `venue.ts`

1. Put a measurement grid over the plan (50 px lines, labelled every 100) and
   read coordinates off it. Work out metres-per-pixel from the scale reference.
2. Write every position in **drawing pixels** through `planX`/`planY`, so any
   table can be checked against the drawing by eye. Venue y runs from the
   drawing's bottom edge up, so the bottom of the drawing is nearest the camera
   and the owner's left/right stay where they drew them.
3. `zones`: one per section, with the owner's names, an outline polygon, `open`
   (outdoor), `floor` from a single `ZONE_ELEVATIONS` table, and `labelAt`
   where the name is written on the plan.
4. `floors`: one slab per level (a raised platform before the zone it sits in
   — first match wins). `RISER` is one step drawn at ~2.6× real so it reads;
   every level is a whole number of risers. `steps` at the real crossings.
5. `tables`: id `t<label lowercased>`, the owner's number as `label`, real seat
   count, footprint in metres, `rot` 0/90, `shape` rect/round/diamond (a
   diamond is a square at 45°). Staff numbers are the source of truth.
6. `fixtures` (kitchen, toilets, counters, banquettes, planters), `walls`
   (`wall` full-height and culled when facing camera, `parapet` for open
   sections, `glass` for glazed runs so the view stays open), and decor —
   `plants`, `hedges`, `greenWalls`, `paintings` — placed from the plan and
   photos, never covering a table, a label or a walkway.
7. `npm test`. `auditVenue()` must be empty: no overlaps, every table inside
   its section. Flag, don't guess, anything the plan leaves ambiguous (a
   table on a boundary, chairs drawn vs seats) — list them for the owner.

## Phase 2 — the website

1. Copy the booking module in. Scope its CSS under `.pt-root`; set the palette
   in both `src/app/booking.css` (token block) and `src/booking/scene/palette.ts`
   from the client site's colours.
2. Opening hours come from the site's single hours source through
   `openingOn()`; never give the booking system its own times. Set `service`
   (sitting lengths, turnaround) from the brief.
3. `/book-a-table` is full screen: the client's logo, a tap-to-call link, and
   "Return to home page". On phones the room fills the screen, starts zoomed,
   drags to pan, and a drag never selects a table.
4. Change the reference prefix (`PK-`) in `src/booking/server/api.ts` to the
   brief's prefix.
5. Every "Book" button on the site points at `/book-a-table`. The phone number
   is a `tel:` link.

## Phase 3 — register the venue in Peregrine's database

1. Generate a fixed venue UUID and set it as the constant in
   `scripts/peregrine-seed.mjs`. `npm run peregrine:seed > <venue>.sql`, and
   save a copy in the Peregrine repo under `supabase/seed/`.
2. Give me the SQL to paste into Supabase (project `supabase-booking`) and the
   steps to create the owner's login and their `venue_members` row
   (role `owner`), plus ours (role `manager`).
3. Website env on its Vercel project (Production + Preview): connect the
   `supabase-booking` store (no preview branches), then add
   `PEREGRINE_VENUE_ID`. The store accepts any integration prefix. The
   service-role key is server-only — never `NEXT_PUBLIC_`.
4. Do not create a new Supabase project or a new Vercel project for the
   console. One database, one console; a venue is rows.

## Phase 4 — verify

- `npm test` and `npm run build` pass.
- Screenshots of the room at all four rotations and at phone size: nothing
  floating, sunk, hidden or unclickable; every section label visible.
- On a preview deploy: a booking from the site lands in Supabase with
  `source = website` and the venue's id, shows on
  `/console/<slug>/list` without a refresh, and a second booking for the same
  table and time is refused.
- The console locally with sample data: `PEREGRINE_CONSOLE_DEMO=1` (dev only).

## Phase 5 — cutover from the old system

- `npm run peregrine:import -- export.csv` (dry run), fix the notes it prints,
  then `--commit`. Imports keep their old reference (`RS-…`) and `source`.
- Point the Google Business Profile booking link and every Book button at the
  new page. Keep the old system paid until its last imported booking has passed.

## Deliverables

1. The floor plan traced, tests green, screenshots.
2. A short list of questions for the owner about anything the plan didn't settle.
3. The seed SQL and login steps for me to run.
4. A `docs/PICKUP-<slug>-onboarding.md` in the client repo, in the shape of the
   Peacock's: where everything is, env state, the finish line in order, open
   questions, known gaps.

Don't push to `main` or deploy to production without asking.

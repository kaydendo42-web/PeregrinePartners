-- Peregrine bookings: one database for every client venue.
--
-- A client (The Peacock) is a row in `venues`. People who may sign in to a
-- venue's console are rows in `venue_members`. Every other table carries a
-- venue_id, and row-level security lets a signed-in member see and change
-- only their own venue's rows.
--
-- Two ways in:
--   * the venue's public website (a separate Vercel project) writes as the
--     service role from its server — guests never touch this database;
--   * the Peregrine console at peregrinepartners.space/console reads and
--     writes as the signed-in member, through the policies below.
--
-- Whichever door a booking comes through, `bookings_no_double_booking` is the
-- last word on whether a table is free.

create extension if not exists btree_gist;

-- --- venues and who may run them -----------------------------------------

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  timezone text not null default 'Australia/Melbourne',
  website_url text,
  booking_url text,
  phone text,
  created_at timestamptz not null default now()
);

create table public.venue_members (
  venue_id uuid not null references public.venues (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'staff' check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  primary key (venue_id, user_id)
);

create index venue_members_user on public.venue_members (user_id);

-- --- the floor -------------------------------------------------------------

create table public.sections (
  venue_id uuid not null references public.venues (id) on delete cascade,
  id text not null,
  name text not null,
  sort int not null default 0,
  indoor boolean not null default true,
  primary key (venue_id, id)
);

-- Positions are metres on the venue's own plan, the same numbers the website's
-- 3D room is built from (seeded from its venue.ts).
create table public.venue_tables (
  venue_id uuid not null references public.venues (id) on delete cascade,
  id text not null,
  label text not null,
  section_id text not null,
  seats int not null check (seats > 0),
  shape text not null check (shape in ('rect', 'round', 'diamond')),
  x numeric not null,
  y numeric not null,
  w numeric not null,
  d numeric not null,
  rot int not null default 0,
  active boolean not null default true,
  primary key (venue_id, id),
  foreign key (venue_id, section_id) references public.sections (venue_id, id)
);

-- --- the diary -------------------------------------------------------------

create table public.bookings (
  -- The guest's reference, e.g. PK-7QK2MD. Imported bookings keep theirs.
  id text primary key,
  venue_id uuid not null references public.venues (id) on delete cascade,
  -- Null for a booking not yet given a table (some imports arrive that way).
  table_id text,
  starts_at timestamptz not null,
  -- When the table is free again: the sitting plus the turnaround.
  ends_at timestamptz not null,
  duration_min int not null check (duration_min > 0),
  party_size int not null check (party_size between 1 and 60),
  guest_name text not null,
  phone text not null default '',
  email text not null default '',
  notes text,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'seated', 'cancelled', 'no_show')),
  source text not null default 'website'
    check (source in ('website', 'console', 'phone', 'walk_in', 'resos')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  foreign key (venue_id, table_id) references public.venue_tables (venue_id, id),
  -- No table holds two live bookings at once. Checked inside Postgres, so it
  -- holds for the website, the console and any import alike.
  constraint bookings_no_double_booking exclude using gist (
    venue_id with =,
    table_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('confirmed', 'seated'))
);

create index bookings_venue_starts on public.bookings (venue_id, starts_at);

create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger bookings_touch before update on public.bookings
  for each row execute function public.touch_updated_at();

-- A guest is whoever shares an email (or, lacking one, a phone number) across
-- bookings. A view rather than a table: nothing to keep in step.
create view public.customer_summary with (security_invoker = true) as
select
  venue_id,
  coalesce(lower(nullif(email, '')), nullif(phone, ''), lower(guest_name)) as key,
  (array_agg(guest_name order by starts_at desc))[1] as name,
  (array_agg(nullif(email, '') order by starts_at desc))[1] as email,
  (array_agg(nullif(phone, '') order by starts_at desc))[1] as phone,
  count(*) filter (where status in ('confirmed', 'seated')) as visits,
  count(*) filter (where status = 'no_show') as no_shows,
  count(*) filter (where status = 'cancelled') as cancellations,
  min(starts_at) as first_visit,
  max(starts_at) as last_visit
from public.bookings
group by venue_id, coalesce(lower(nullif(email, '')), nullif(phone, ''), lower(guest_name));

-- --- who may see what --------------------------------------------------------

create function public.is_member(v uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.venue_members where venue_id = v and user_id = auth.uid()
  );
$$;

alter table public.venues enable row level security;
alter table public.venue_members enable row level security;
alter table public.sections enable row level security;
alter table public.venue_tables enable row level security;
alter table public.bookings enable row level security;

create policy "members read their venue" on public.venues
  for select to authenticated using (public.is_member(id));

create policy "members see who else runs their venue" on public.venue_members
  for select to authenticated using (user_id = auth.uid() or public.is_member(venue_id));

create policy "members read sections" on public.sections
  for select to authenticated using (public.is_member(venue_id));

create policy "members read tables" on public.venue_tables
  for select to authenticated using (public.is_member(venue_id));

create policy "members read bookings" on public.bookings
  for select to authenticated using (public.is_member(venue_id));

create policy "members add bookings" on public.bookings
  for insert to authenticated with check (public.is_member(venue_id));

-- No delete: a booking is cancelled, never erased, so the history stays true.
create policy "members change bookings" on public.bookings
  for update to authenticated
  using (public.is_member(venue_id))
  with check (public.is_member(venue_id));

-- New bookings appear on an open console without a refresh.
alter publication supabase_realtime add table public.bookings;

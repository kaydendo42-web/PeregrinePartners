-- Joined tables, and the floor the way Jenny sets it up in Resos.
--
-- A booking can now hold several tables pushed together (a party of nine on
-- Courtyard 2 + 3 + 4). bookings.table_ids is the list; bookings.table_id stays
-- as the first of it, so everything that already reads or writes table_id keeps
-- working: write table_id alone and the list follows, write the list and
-- table_id follows. No-double-booking moves to booking_tables, one row per
-- table a live booking holds, so a joined set can never overlap anyone sitting
-- at one of its tables, whichever way the booking arrived.

-- --- the floor: seat ranges, priorities, combinations ------------------------

alter table public.venue_tables
  add column seats_min int not null default 1 check (seats_min > 0),
  add column priority int not null default 5 check (priority between 1 and 10);

create table public.table_combinations (
  venue_id uuid not null references public.venues (id) on delete cascade,
  id text not null,
  table_ids text[] not null check (array_length(table_ids, 1) >= 2),
  seats_min int not null,
  seats_max int not null,
  priority int not null default 5,
  primary key (venue_id, id)
);

alter table public.table_combinations enable row level security;

create policy "members read combinations" on public.table_combinations
  for select to authenticated using (public.is_member(venue_id));

create policy "two-step sign-in required" on public.table_combinations
  as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- --- bookings hold a list of tables ------------------------------------------

alter table public.bookings add column table_ids text[] not null default '{}';
update public.bookings set table_ids = array[table_id] where table_id is not null;

create table public.booking_tables (
  booking_id text not null references public.bookings (id) on delete cascade,
  venue_id uuid not null,
  table_id text not null,
  during tstzrange not null,
  primary key (booking_id, table_id),
  foreign key (venue_id, table_id) references public.venue_tables (venue_id, id),
  constraint booking_tables_no_double_booking exclude using gist (
    venue_id with =,
    table_id with =,
    during with &&
  )
);

alter table public.booking_tables enable row level security;

create policy "members read held tables" on public.booking_tables
  for select to authenticated using (public.is_member(venue_id));

create policy "two-step sign-in required" on public.booking_tables
  as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- Keep table_id and table_ids in step, whichever one the writer set.
create function public.bookings_table_ids() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if coalesce(array_length(new.table_ids, 1), 0) = 0 and new.table_id is not null then
      new.table_ids := array[new.table_id];
    end if;
  elsif new.table_id is distinct from old.table_id and new.table_ids = old.table_ids then
    new.table_ids := case when new.table_id is null then '{}'::text[] else array[new.table_id] end;
  end if;
  new.table_id := new.table_ids[1];
  return new;
end;
$$;

create trigger bookings_table_ids before insert or update on public.bookings
  for each row execute function public.bookings_table_ids();

-- One booking_tables row per table a live booking holds. A clash raises the
-- exclusion constraint (23P01), which aborts the booking write itself.
create function public.sync_booking_tables() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.booking_tables where booking_id = new.id;
  if new.status in ('confirmed', 'seated') then
    insert into public.booking_tables (booking_id, venue_id, table_id, during)
    select new.id, new.venue_id, t, tstzrange(new.starts_at, new.ends_at)
    from unnest(new.table_ids) as t;
  end if;
  return null;
end;
$$;

create trigger bookings_sync_tables after insert or update on public.bookings
  for each row execute function public.sync_booking_tables();

insert into public.booking_tables (booking_id, venue_id, table_id, during)
select b.id, b.venue_id, t, tstzrange(b.starts_at, b.ends_at)
from public.bookings b, unnest(b.table_ids) as t
where b.status in ('confirmed', 'seated');

-- booking_tables is the guard now.
alter table public.bookings drop constraint bookings_no_double_booking;

-- The Peacock's $5 dinners: pre-ordered, paid through Square, collected the
-- next day. The website writes these with the service-role key; the console
-- reads them as a two-step-signed-in member of the venue.
--
-- Each dish sells at most a fixed number of portions per pickup day. A
-- checkout holds its portions for a few minutes while the guest pays; an
-- unpaid hold stops counting once it expires, so abandoned checkouts give
-- their portions back without a sweeper.

create table thepeacock.dinner_orders (
  id text primary key,
  venue_id uuid not null references thepeacock.venues (id) on delete cascade,
  pickup_date date not null,
  guest_name text not null,
  phone text not null,
  email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'expired', 'cancelled', 'collected')),
  total_cents integer not null check (total_cents >= 0),
  hold_expires_at timestamptz not null,
  square_order_id text unique,
  square_payment_link_id text,
  checkout_url text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index dinner_orders_day on thepeacock.dinner_orders (venue_id, pickup_date);

create table thepeacock.dinner_order_lines (
  order_id text not null references thepeacock.dinner_orders (id) on delete cascade,
  dish_id text not null,
  dish_name text not null,
  price_cents integer not null check (price_cents >= 0),
  quantity integer not null check (quantity between 1 and 100),
  primary key (order_id, dish_id)
);

-- --- who may see what --------------------------------------------------------

alter table thepeacock.dinner_orders enable row level security;
alter table thepeacock.dinner_order_lines enable row level security;

create policy "two-step sign-in required" on thepeacock.dinner_orders
  as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

create policy "two-step sign-in required" on thepeacock.dinner_order_lines
  as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

create policy "members read dinner orders" on thepeacock.dinner_orders
  for select to authenticated using (thepeacock.is_member(venue_id));

-- Marking an order collected or cancelled. No insert or delete from the
-- console: orders come from the website, and are never erased.
create policy "members change dinner orders" on thepeacock.dinner_orders
  for update to authenticated
  using (thepeacock.is_member(venue_id))
  with check (thepeacock.is_member(venue_id));

create policy "members read dinner order lines" on thepeacock.dinner_order_lines
  for select to authenticated using (
    exists (
      select 1 from thepeacock.dinner_orders o
      where o.id = order_id and thepeacock.is_member(o.venue_id)
    )
  );

-- --- portions ------------------------------------------------------------------

-- Portions of each dish taken on each day in a range: paid and collected
-- orders, and pending ones whose hold hasn't run out.
create function thepeacock.dinner_sold(p_venue uuid, p_from date, p_to date)
returns table (pickup_date date, dish_id text, sold bigint)
language sql stable security definer set search_path = thepeacock, public as $$
  select o.pickup_date, l.dish_id, sum(l.quantity)
  from thepeacock.dinner_orders o
  join thepeacock.dinner_order_lines l on l.order_id = o.id
  where o.venue_id = p_venue
    and o.pickup_date between p_from and p_to
    and (o.status in ('paid', 'collected') or (o.status = 'pending' and o.hold_expires_at > now()))
  group by o.pickup_date, l.dish_id;
$$;

-- Check every dish in an order against the cap and insert the order, as one
-- step. The advisory lock serialises orders for the same venue and day, so two
-- guests can't both buy the 50th portion.
--
-- p_order: { id, venue_id, pickup_date, guest_name, phone, email, total_cents, hold_expires_at }
-- p_lines: [{ dish_id, dish_name, price_cents, quantity }]
-- Returns { ok: true } or { ok: false, dish_id, left }.
create function thepeacock.reserve_dinner_order(p_order jsonb, p_lines jsonb, p_cap integer)
returns jsonb
language plpgsql security definer set search_path = thepeacock, public as $$
declare
  v_venue uuid := (p_order ->> 'venue_id')::uuid;
  v_day date := (p_order ->> 'pickup_date')::date;
  line jsonb;
  taken bigint;
begin
  perform pg_advisory_xact_lock(hashtext('dinners:' || v_venue || ':' || v_day));

  for line in select * from jsonb_array_elements(p_lines) loop
    select coalesce(sum(l.quantity), 0) into taken
    from thepeacock.dinner_orders o
    join thepeacock.dinner_order_lines l on l.order_id = o.id
    where o.venue_id = v_venue and o.pickup_date = v_day and l.dish_id = line ->> 'dish_id'
      and (o.status in ('paid', 'collected') or (o.status = 'pending' and o.hold_expires_at > now()));

    if taken + (line ->> 'quantity')::int > p_cap then
      return jsonb_build_object('ok', false, 'dish_id', line ->> 'dish_id', 'left', greatest(p_cap - taken, 0));
    end if;
  end loop;

  insert into thepeacock.dinner_orders
    (id, venue_id, pickup_date, guest_name, phone, email, total_cents, hold_expires_at)
  values (
    p_order ->> 'id', v_venue, v_day, p_order ->> 'guest_name', p_order ->> 'phone',
    p_order ->> 'email', (p_order ->> 'total_cents')::int, (p_order ->> 'hold_expires_at')::timestamptz
  );

  insert into thepeacock.dinner_order_lines (order_id, dish_id, dish_name, price_cents, quantity)
  select p_order ->> 'id', l ->> 'dish_id', l ->> 'dish_name', (l ->> 'price_cents')::int, (l ->> 'quantity')::int
  from jsonb_array_elements(p_lines) l;

  return jsonb_build_object('ok', true);
end;
$$;

-- Only the website's server (service role) reserves or counts. Default
-- privileges in this schema grant functions to everyone, so take it back.
revoke execute on function thepeacock.dinner_sold(uuid, date, date) from public, anon, authenticated;
revoke execute on function thepeacock.reserve_dinner_order(jsonb, jsonb, integer) from public, anon, authenticated;
grant execute on function thepeacock.dinner_sold(uuid, date, date) to service_role;
grant execute on function thepeacock.reserve_dinner_order(jsonb, jsonb, integer) to service_role;

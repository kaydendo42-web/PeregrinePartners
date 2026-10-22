-- $5 dinners, after Jenny's answers of 22 Oct 2026:
--
-- * Caps differ by dish ($5 dishes 40 a day, $10 dishes 60), so each line now
--   carries its own cap. p_cap stays as the fallback so the signature (and its
--   grants) don't change.
-- * Guests can cancel a paid order online up to 24 hours before pickup and are
--   refunded through Square; the order keeps when and which refund.

alter table thepeacock.dinner_orders
  add column cancelled_at timestamptz,
  add column square_refund_id text;

-- p_lines: [{ dish_id, dish_name, price_cents, quantity, cap }]
create or replace function thepeacock.reserve_dinner_order(p_order jsonb, p_lines jsonb, p_cap integer)
returns jsonb
language plpgsql security definer set search_path = thepeacock, public as $$
declare
  v_venue uuid := (p_order ->> 'venue_id')::uuid;
  v_day date := (p_order ->> 'pickup_date')::date;
  line jsonb;
  cap integer;
  taken bigint;
begin
  perform pg_advisory_xact_lock(hashtext('dinners:' || v_venue || ':' || v_day));

  for line in select * from jsonb_array_elements(p_lines) loop
    cap := coalesce((line ->> 'cap')::int, p_cap);

    select coalesce(sum(l.quantity), 0) into taken
    from thepeacock.dinner_orders o
    join thepeacock.dinner_order_lines l on l.order_id = o.id
    where o.venue_id = v_venue and o.pickup_date = v_day and l.dish_id = line ->> 'dish_id'
      and (o.status in ('paid', 'collected') or (o.status = 'pending' and o.hold_expires_at > now()));

    if taken + (line ->> 'quantity')::int > cap then
      return jsonb_build_object('ok', false, 'dish_id', line ->> 'dish_id', 'left', greatest(cap - taken, 0));
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

-- create or replace keeps existing grants, but say it again in case.
revoke execute on function thepeacock.reserve_dinner_order(jsonb, jsonb, integer) from public, anon, authenticated;
grant execute on function thepeacock.reserve_dinner_order(jsonb, jsonb, integer) to service_role;

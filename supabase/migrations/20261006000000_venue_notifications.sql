-- Booking alerts, switched on and off by the venue from the console.
--
-- The venue's website reads these two columns (service key) each time a guest
-- books: notify_bookings decides whether the venue gets an alert email, and
-- notify_email where it goes (null = the website's configured inbox). The
-- guest's own confirmation is not affected by either.

alter table public.venues
  add column notify_bookings boolean not null default true,
  add column notify_email text;

-- Jenny had Resos's booking notifications switched off; start her there.
update public.venues set notify_bookings = false
where id = 'fb19b599-8b90-4576-b84a-1ff0f4eb1f7e';

-- Members may change these two settings and nothing else about the venue, and
-- only an owner or a manager may. Column grants limit what; the policy limits who.
revoke update on public.venues from authenticated;
grant update (notify_bookings, notify_email) on public.venues to authenticated;

create function public.can_manage(v uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.venue_members
    where venue_id = v and user_id = auth.uid() and role in ('owner', 'manager')
  );
$$;

create policy "owners and managers change notifications" on public.venues
  for update to authenticated
  using (public.can_manage(id))
  with check (public.can_manage(id));

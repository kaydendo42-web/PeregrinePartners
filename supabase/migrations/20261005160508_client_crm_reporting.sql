-- Shared booking reporting and guest CRM. Existing venue permissions remain authoritative.
create function public.booking_guest_key(p_email text,p_phone text,p_id text) returns text
language sql immutable set search_path=pg_catalog as $$
 select coalesce('email:'||lower(nullif(btrim(p_email),'')), 'phone:'||nullif(btrim(p_phone),''), 'booking:'||p_id);
$$;
revoke all on function public.booking_guest_key(text,text,text) from public,anon;
grant execute on function public.booking_guest_key(text,text,text) to authenticated;

create function public.booking_dashboard(p_venue uuid,p_from date,p_to date) returns jsonb
language plpgsql stable security invoker set search_path=pg_catalog,public as $$
declare tz text; lo timestamptz; hi timestamptz; answer jsonb;
begin
 if auth.uid() is null or coalesce(auth.jwt()->>'aal','')<>'aal2' then raise insufficient_privilege; end if;
 select timezone into tz from public.venues where id=p_venue;
 if tz is null then raise insufficient_privilege; end if;
 if p_from is null or p_to is null or p_to<p_from or p_to-p_from>92 then raise exception 'Choose a range of up to 93 days' using errcode='22023'; end if;
 lo:=p_from::timestamp at time zone tz; hi:=(p_to+1)::timestamp at time zone tz;
 with selected as materialized (
   select starts_at,party_size,status,source from public.bookings where venue_id=p_venue and starts_at>=lo and starts_at<hi
 ), daily as (
   select (starts_at at time zone tz)::date as day,count(*) as bookings,
    coalesce(sum(party_size) filter(where status in ('confirmed','seated')),0) as guests from selected group by 1
 ), dates as (select p_from+i as day from generate_series(0,p_to-p_from) i), sources as (
   select source,count(*) as bookings from selected group by source
 )
 select jsonb_build_object(
  'from',p_from,'to',p_to,'timezone',tz,'checked_at',now(),
  'bookings',(select count(*) from selected),
  'guests',(select coalesce(sum(party_size) filter(where status in ('confirmed','seated')),0) from selected),
  'cancelled',(select count(*) from selected where status='cancelled'),
  'no_shows',(select count(*) from selected where status='no_show'),
  'series',(select jsonb_agg(jsonb_build_object('day',d.day,'bookings',coalesce(b.bookings,0),'guests',coalesce(b.guests,0)) order by d.day) from dates d left join daily b using(day)),
  'sources',coalesce((select jsonb_agg(jsonb_build_object('source',source,'bookings',bookings) order by bookings desc,source) from sources),'[]'::jsonb),
  'last_booking_update',(select max(updated_at) from public.bookings where venue_id=p_venue),
  'upcoming',(select count(*) from public.bookings where venue_id=p_venue and starts_at>=now() and status in ('confirmed','seated'))
 ) into answer;
 return answer;
end $$;
revoke all on function public.booking_dashboard(uuid,date,date) from public,anon;
grant execute on function public.booking_dashboard(uuid,date,date) to authenticated;

create table public.client_crm_entries (
 id uuid primary key default gen_random_uuid(),
 venue_id uuid not null references public.venues(id),
 booking_id text not null references public.bookings(id),
 kind text not null check(kind in ('note','task')),
 body text not null check(length(btrim(body)) between 1 and 2000),
 due_on date,
 state text not null default 'open' check(state in ('open','done','cancelled')),
 version bigint not null default 1 check(version between 1 and 9007199254740991),
 actor_id uuid not null default auth.uid() references auth.users(id),
 updated_by uuid not null default auth.uid() references auth.users(id),
 request_id uuid not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(venue_id,actor_id,request_id),
 check((kind='task' and due_on is not null) or (kind='note' and due_on is null and state='open'))
);
create index client_crm_entries_booking on public.client_crm_entries(venue_id,booking_id,created_at desc);
create index client_crm_entries_due on public.client_crm_entries(venue_id,due_on) where kind='task' and state='open';
alter table public.client_crm_entries enable row level security;
create policy "Venue members read guest CRM" on public.client_crm_entries for select to authenticated
 using (public.is_member(venue_id) and (select auth.jwt()->>'aal')='aal2');
create policy "Venue members add guest CRM" on public.client_crm_entries for insert to authenticated
 with check (public.is_member(venue_id) and (select auth.jwt()->>'aal')='aal2' and actor_id=(select auth.uid())
 and exists(select 1 from public.bookings b where b.id=booking_id and b.venue_id=client_crm_entries.venue_id));
create policy "Venue members finish guest tasks" on public.client_crm_entries for update to authenticated
 using (public.is_member(venue_id) and (select auth.jwt()->>'aal')='aal2' and kind='task')
 with check (public.is_member(venue_id) and (select auth.jwt()->>'aal')='aal2' and kind='task');
revoke all on public.client_crm_entries from public,anon,authenticated;
grant select on public.client_crm_entries to authenticated;
grant insert(venue_id,booking_id,kind,body,due_on,request_id) on public.client_crm_entries to authenticated;
grant update(state) on public.client_crm_entries to authenticated;

create function public.client_crm_touch() returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 new.version:=old.version+1; new.updated_at:=now(); new.updated_by:=auth.uid();
 return new;
end $$;
revoke all on function public.client_crm_touch() from public,anon,authenticated;
create trigger client_crm_touch before update on public.client_crm_entries for each row execute function public.client_crm_touch();

create function public.client_crm_add_entry(p_venue uuid,p_booking text,p_kind text,p_body text,p_due date,p_request uuid) returns jsonb
language plpgsql security invoker set search_path=pg_catalog,public as $$
declare saved public.client_crm_entries;
begin
 if auth.uid() is null or coalesce(auth.jwt()->>'aal','')<>'aal2' or not public.is_member(p_venue) then raise insufficient_privilege; end if;
 if not exists(select 1 from public.bookings where venue_id=p_venue and id=p_booking) then raise insufficient_privilege; end if;
 select * into saved from public.client_crm_entries where venue_id=p_venue and actor_id=auth.uid() and request_id=p_request;
 if found then
  if saved.booking_id<>p_booking or saved.kind<>p_kind or saved.body<>btrim(p_body) or saved.due_on is distinct from p_due then
   raise exception 'Retry does not match the original entry' using errcode='22023';
  end if;
  return to_jsonb(saved);
 end if;
 insert into public.client_crm_entries(venue_id,booking_id,kind,body,due_on,request_id)
 values(p_venue,p_booking,p_kind,btrim(p_body),p_due,p_request)
 on conflict(venue_id,actor_id,request_id) do nothing returning * into saved;
 if not found then
  select * into saved from public.client_crm_entries where venue_id=p_venue and actor_id=auth.uid() and request_id=p_request;
  if saved.booking_id<>p_booking or saved.kind<>p_kind or saved.body<>btrim(p_body) or saved.due_on is distinct from p_due then
   raise exception 'Retry does not match the original entry' using errcode='22023';
  end if;
 end if;
 return to_jsonb(saved);
end $$;
create function public.client_crm_set_state(p_venue uuid,p_id uuid,p_version bigint,p_state text) returns jsonb
language plpgsql security invoker set search_path=pg_catalog,public as $$
declare saved public.client_crm_entries;
begin
 if auth.uid() is null or coalesce(auth.jwt()->>'aal','')<>'aal2' or not public.is_member(p_venue) then raise insufficient_privilege; end if;
 if p_state not in ('open','done','cancelled') or p_version is null then raise exception 'Invalid task state' using errcode='22023'; end if;
 update public.client_crm_entries set state=p_state where venue_id=p_venue and id=p_id and kind='task' and version=p_version returning * into saved;
 if found then return jsonb_build_object('ok',true,'value',to_jsonb(saved)); end if;
 select * into saved from public.client_crm_entries where venue_id=p_venue and id=p_id and kind='task';
 if not found then raise insufficient_privilege; end if;
 return jsonb_build_object('ok',false,'kind','conflict','message','Someone changed this task. Review its latest status before trying again.','current',to_jsonb(saved));
end $$;
revoke all on function public.client_crm_add_entry(uuid,text,text,text,date,uuid),public.client_crm_set_state(uuid,uuid,bigint,text) from public,anon;
grant execute on function public.client_crm_add_entry(uuid,text,text,text,date,uuid),public.client_crm_set_state(uuid,uuid,bigint,text) to authenticated;

create function public.client_crm_customers(p_venue uuid,p_q text default '',p_page integer default 1) returns jsonb
language plpgsql stable security invoker set search_path=pg_catalog,public as $$
declare answer jsonb;
begin
 if auth.uid() is null or coalesce(auth.jwt()->>'aal','')<>'aal2' or not exists(select 1 from public.venues where id=p_venue) then raise insufficient_privilege; end if;
 if p_page is null or p_page<1 or p_page>100000 or length(p_q)>300 then raise exception 'Invalid customer filter' using errcode='22023'; end if;
 with people as (
  select public.booking_guest_key(email,phone,id) as key,
   (array_agg(id order by created_at,id))[1] as booking_id,
   (array_agg(guest_name order by starts_at desc,id))[1] as name,
   (array_agg(nullif(email,'') order by starts_at desc,id))[1] as email,
   (array_agg(nullif(phone,'') order by starts_at desc,id))[1] as phone,
   count(*) as bookings,count(*) filter(where status='no_show') as no_shows,
   count(*) filter(where status='cancelled') as cancellations,
   min(starts_at) as first_booking,max(starts_at) as last_booking
  from public.bookings where venue_id=p_venue group by 1
 ), matched as materialized (
  select * from people where p_q='' or strpos(lower(coalesce(name,'')||' '||coalesce(email,'')||' '||coalesce(phone,'')),lower(p_q))>0
 ), page as (select * from matched order by last_booking desc,booking_id offset (p_page-1)*50 limit 50)
 select jsonb_build_object('total',(select count(*) from matched),'rows',coalesce((select jsonb_agg(to_jsonb(p)-'key' order by last_booking desc,booking_id) from page p),'[]'::jsonb)) into answer;
 return answer;
end $$;
create function public.client_crm_customer(p_venue uuid,p_booking text) returns jsonb
language plpgsql stable security invoker set search_path=pg_catalog,public as $$
declare guest_key text; answer jsonb;
begin
 if auth.uid() is null or coalesce(auth.jwt()->>'aal','')<>'aal2' then raise insufficient_privilege; end if;
 select public.booking_guest_key(email,phone,id) into guest_key from public.bookings where venue_id=p_venue and id=p_booking;
 if guest_key is null then raise insufficient_privilege; end if;
 with history as materialized (
  select id,guest_name,email,phone,starts_at,party_size,status,source from public.bookings
   where venue_id=p_venue and public.booking_guest_key(email,phone,id)=guest_key
 ), entries as (
  select e.* from public.client_crm_entries e join history h on h.id=e.booking_id where e.venue_id=p_venue
  order by e.created_at desc,e.id limit 100
 )
 select jsonb_build_object('profile',(select jsonb_build_object('name',guest_name,'email',nullif(email,''),'phone',nullif(phone,'')) from history order by starts_at desc,id limit 1),
 'booking_count',(select count(*) from history),
 'history',coalesce((select jsonb_agg(to_jsonb(h) order by starts_at desc,id) from (select * from history order by starts_at desc,id limit 100) h),'[]'::jsonb),
 'entries',coalesce((select jsonb_agg(to_jsonb(e) order by created_at desc,id) from entries e),'[]'::jsonb)) into answer;
 return answer;
end $$;
revoke all on function public.client_crm_customers(uuid,text,integer),public.client_crm_customer(uuid,text) from public,anon;
grant execute on function public.client_crm_customers(uuid,text,integer),public.client_crm_customer(uuid,text) to authenticated;
alter publication supabase_realtime add table public.client_crm_entries;

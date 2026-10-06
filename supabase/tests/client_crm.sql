-- Disposable fixtures. Never seed synthetic users into a live auth service.
begin;
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000081'),('00000000-0000-4000-8000-000000000082');
insert into public.venues(id,name,slug) values ('00000000-0000-4000-8000-000000000083','Guest One','guest-one'),('00000000-0000-4000-8000-000000000084','Guest Two','guest-two');
insert into public.venue_members(venue_id,user_id) values ('00000000-0000-4000-8000-000000000083','00000000-0000-4000-8000-000000000081'),('00000000-0000-4000-8000-000000000084','00000000-0000-4000-8000-000000000082');
insert into public.bookings(id,venue_id,guest_name,email,phone,starts_at,party_size,status,source) values
 ('CRM-A','00000000-0000-4000-8000-000000000083','Alex','Alex@example.test','','2026-10-03T14:00:00Z',2,'confirmed','website'),
 ('CRM-B','00000000-0000-4000-8000-000000000083','Alex','alex@example.test','','2026-10-04T12:59:00Z',3,'cancelled','phone'),
 ('CRM-C','00000000-0000-4000-8000-000000000083','Alex','','','2026-10-04T13:00:00Z',4,'confirmed','website'),
 ('CRM-D','00000000-0000-4000-8000-000000000083','Alex','','','2026-10-05T03:00:00Z',5,'confirmed','website'),
 ('CRM-E','00000000-0000-4000-8000-000000000084','Other','other@example.test','','2026-10-04T03:00:00Z',6,'confirmed','website');
set local role anon;
do $$ begin
 begin perform public.booking_dashboard('00000000-0000-4000-8000-000000000083','2026-10-04','2026-10-04'); raise exception 'Anonymous report accepted'; exception when insufficient_privilege then null; end;
 begin perform * from public.client_crm_entries; raise exception 'Anonymous entries accepted'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000081","aal":"aal1"}',true);
do $$ begin
 begin perform public.client_crm_customers('00000000-0000-4000-8000-000000000083'); raise exception 'aal1 customers accepted'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000081","aal":"aal2"}',true);
do $$ declare r jsonb; saved jsonb; retry jsonb; task jsonb; changed jsonb; begin
 r:=public.booking_dashboard('00000000-0000-4000-8000-000000000083','2026-10-04','2026-10-04');
 if (r->>'bookings')::int<>2 or (r->>'guests')::int<>2 or (r->>'cancelled')::int<>1 or jsonb_array_length(r->'series')<>1 then raise exception 'DST boundaries or cancellation totals incorrect: %',r; end if;
 r:=public.client_crm_customers('00000000-0000-4000-8000-000000000083');
 if (r->>'total')::int<>3 then raise exception 'Email grouping / uncontactable separation failed: %',r; end if;
 begin perform public.client_crm_customer('00000000-0000-4000-8000-000000000083','CRM-E'); raise exception 'Cross-venue customer read accepted'; exception when insufficient_privilege then null; end;
 begin perform public.booking_dashboard('00000000-0000-4000-8000-000000000084','2026-10-04','2026-10-04'); raise exception 'Cross-venue report accepted'; exception when insufficient_privilege then null; end;
 begin perform public.client_crm_add_entry('00000000-0000-4000-8000-000000000083','CRM-E','note','Cross venue',null,'00000000-0000-4000-8000-000000000085'); raise exception 'Cross-venue entry accepted'; exception when insufficient_privilege then null; end;
 saved:=public.client_crm_add_entry('00000000-0000-4000-8000-000000000083','CRM-A','note','First note',null,'00000000-0000-4000-8000-000000000086');
 retry:=public.client_crm_add_entry('00000000-0000-4000-8000-000000000083','CRM-A','note','First note',null,'00000000-0000-4000-8000-000000000086');
 if saved->>'id'<>retry->>'id' or saved->>'actor_id'<>'00000000-0000-4000-8000-000000000081' then raise exception 'Retry or attribution incorrect'; end if;
 begin update public.client_crm_entries set actor_id='00000000-0000-4000-8000-000000000082'; raise exception 'Author spoof accepted'; exception when insufficient_privilege then null; end;
 begin perform public.client_crm_add_entry('00000000-0000-4000-8000-000000000083','CRM-A','note','Changed retry',null,'00000000-0000-4000-8000-000000000086'); raise exception 'Changed retry accepted'; exception when invalid_parameter_value then null; end;
 task:=public.client_crm_add_entry('00000000-0000-4000-8000-000000000083','CRM-A','task','Call guest','2026-10-06','00000000-0000-4000-8000-000000000087');
 changed:=public.client_crm_set_state('00000000-0000-4000-8000-000000000083',(task->>'id')::uuid,1,'done');
 if changed->>'ok'<>'true' or changed->'value'->>'version'<>'2' then raise exception 'Task version did not increment'; end if;
 changed:=public.client_crm_set_state('00000000-0000-4000-8000-000000000083',(task->>'id')::uuid,1,'cancelled');
 if changed->>'kind'<>'conflict' or changed->'current'->>'state'<>'done' then raise exception 'Stale task overwrote completion'; end if;
 r:=public.client_crm_customer('00000000-0000-4000-8000-000000000083','CRM-B');
 if jsonb_array_length(r->'entries')<>2 or (r->>'booking_count')::int<>2 then raise exception 'Notes lost across grouped booking anchors'; end if;
 if exists(select 1 from public.crm_businesses) then raise exception 'Client guest access reached internal outreach'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000082","aal":"aal2"}',true);
do $$ begin
 if exists(select 1 from public.client_crm_entries) then raise exception 'Other client read guest notes'; end if;
end $$;
rollback;

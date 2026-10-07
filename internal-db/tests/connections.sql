-- Disposable fixtures; never run synthetic identities on a live project.
begin;
do $$ begin
 if to_regclass('public.bookings') is not null or to_regclass('public.venues') is not null or to_regclass('public.client_crm_entries') is not null then
  raise exception 'Client data tables leaked into internal schema';
 end if;
end $$;
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000711');
insert into public.platform_owners(user_id) values ('00000000-0000-4000-8000-000000000711');
insert into public.crm_workspaces(id,slug,name,kind) values
 ('00000000-0000-4000-8000-000000000721','internal-test','Internal','internal'),
 ('00000000-0000-4000-8000-000000000722','other-test','Other','internal');
insert into public.crm_workspace_members(workspace_id,user_id,display_name) values
 ('00000000-0000-4000-8000-000000000721','00000000-0000-4000-8000-000000000711','Founder');
insert into public.crm_booking_links(workspace_id,venue_id) values
 ('00000000-0000-4000-8000-000000000721','00000000-0000-4000-8000-000000000731'),
 ('00000000-0000-4000-8000-000000000722','00000000-0000-4000-8000-000000000732');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000711","role":"authenticated","aal":"aal1"}',true);
do $$ begin
 if exists(select 1 from public.crm_booking_links) then raise exception 'Connection visible without MFA'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000711","role":"authenticated","aal":"aal2"}',true);
do $$ declare r jsonb; begin
 if (select count(*) from public.crm_booking_links)<>1 then raise exception 'Cross-workspace connection visible'; end if;
 begin
  insert into public.crm_booking_links(workspace_id,venue_id) values ('00000000-0000-4000-8000-000000000721',gen_random_uuid());
  raise exception 'Direct connection self-grant accepted';
 exception when insufficient_privilege then null; end;
 begin
  perform public.crm_save_client('00000000-0000-4000-8000-000000000721','{"name":"Wrong link","venue_id":"00000000-0000-4000-8000-000000000732","status":"active"}',null,gen_random_uuid());
  raise exception 'Other workspace connection accepted';
 exception when check_violation then null; end;
 r:=public.crm_save_client('00000000-0000-4000-8000-000000000721','{"name":"Approved link","venue_id":"00000000-0000-4000-8000-000000000731","status":"active"}',null,gen_random_uuid());
 if r->>'ok'<>'true' then raise exception 'Approved connection failed'; end if;
end $$;
reset role;
rollback;

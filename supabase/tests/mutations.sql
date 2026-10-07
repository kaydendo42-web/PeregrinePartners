begin;
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000111'),('00000000-0000-4000-8000-000000000112');
insert into public.platform_owners(user_id) values ('00000000-0000-4000-8000-000000000111');
insert into public.crm_workspaces(id,slug,name,kind) values ('00000000-0000-4000-8000-000000000121','mutation-test','Test','internal');
insert into public.crm_workspace_members(workspace_id,user_id,display_name,active) values
 ('00000000-0000-4000-8000-000000000121','00000000-0000-4000-8000-000000000111','One',true),
 ('00000000-0000-4000-8000-000000000121','00000000-0000-4000-8000-000000000112','Inactive',false);
insert into public.crm_businesses(id,workspace_id,name) values ('00000000-0000-4000-8000-000000000131','00000000-0000-4000-8000-000000000121','Prospect');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000111","role":"authenticated","aal":"aal2"}',true);
do $$ declare r jsonb; n integer; begin
 r:=public.crm_update_business('00000000-0000-4000-8000-000000000121','00000000-0000-4000-8000-000000000131',1,'{"stage":"contacted"}','00000000-0000-4000-8000-000000000141');
 if r->>'ok'<>'true' then raise exception 'Save failed'; end if;
 r:=public.crm_update_business('00000000-0000-4000-8000-000000000121','00000000-0000-4000-8000-000000000131',1,'{"stage":"replied"}','00000000-0000-4000-8000-000000000142');
 if r->>'kind'<>'conflict' then raise exception 'Stale edit overwritten'; end if;
 if (select stage from public.crm_businesses)<>'contacted' then raise exception 'Conflict changed stage'; end if;
 select count(*) into n from public.crm_activities;
 r:=public.crm_update_business('00000000-0000-4000-8000-000000000121','00000000-0000-4000-8000-000000000131',1,'{"stage":"contacted"}','00000000-0000-4000-8000-000000000141');
 if r->>'ok'<>'true' or (select count(*) from public.crm_activities)<>n then raise exception 'Retry duplicated activity';end if;
 begin
  perform public.crm_update_business('00000000-0000-4000-8000-000000000121','00000000-0000-4000-8000-000000000131',2,'{"stage":"lost"}','00000000-0000-4000-8000-000000000141');
  raise exception 'Reused request with different payload accepted';
 exception when check_violation then null;end;
 begin
  perform public.crm_update_business('00000000-0000-4000-8000-000000000121','00000000-0000-4000-8000-000000000131',2,'{"assigned_to":"00000000-0000-4000-8000-000000000112"}','00000000-0000-4000-8000-000000000143');
  raise exception 'Inactive assignment accepted';
 exception when check_violation then null;end;
 r:=public.crm_save_follow_up('00000000-0000-4000-8000-000000000121','{"business_id":"00000000-0000-4000-8000-000000000131","assigned_to":"00000000-0000-4000-8000-000000000111","due_at":"2026-10-06T03:00:00Z","instruction":"Call back","state":"open"}',null,'00000000-0000-4000-8000-000000000144');
 if r->>'ok'<>'true' then raise exception 'Follow-up failed';end if;
 perform public.crm_update_business('00000000-0000-4000-8000-000000000121','00000000-0000-4000-8000-000000000131',2,'{"do_not_contact":true}','00000000-0000-4000-8000-000000000145');
 if exists(select 1 from public.crm_follow_ups where state='open') then raise exception 'Opt-out retained follow-up';end if;
 begin
  perform public.crm_add_activity('00000000-0000-4000-8000-000000000121','00000000-0000-4000-8000-000000000131','{"kind":"outreach","channel":"email","summary":"Hello","occurred_at":"2026-10-05T00:00:00Z","mark_replied":false}','00000000-0000-4000-8000-000000000146');
  raise exception 'Opt-out allowed outreach';
 exception when check_violation then null;end;
 perform public.crm_add_activity('00000000-0000-4000-8000-000000000121','00000000-0000-4000-8000-000000000131','{"kind":"note","summary":"Keep this history","occurred_at":"2026-10-05T00:00:00Z","mark_replied":false}','00000000-0000-4000-8000-000000000147');
 if exists(select 1 from public.crm_activities where actor_id<>'00000000-0000-4000-8000-000000000111') then raise exception 'Wrong actor';end if;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000112","role":"authenticated","aal":"aal2"}',true);
do $$ begin
 begin
  perform public.crm_create_business('00000000-0000-4000-8000-000000000121','{"name":"Attack"}','00000000-0000-4000-8000-000000000148');
  raise exception 'Client direct RPC accepted';
 exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;

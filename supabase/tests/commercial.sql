begin;
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000211');
insert into public.platform_owners(user_id) values ('00000000-0000-4000-8000-000000000211');
insert into public.crm_workspaces(id,slug,name,kind) values ('00000000-0000-4000-8000-000000000221','commercial-test','Test','internal');
insert into public.crm_workspace_members(workspace_id,user_id,display_name) values ('00000000-0000-4000-8000-000000000221','00000000-0000-4000-8000-000000000211','Founder');
insert into public.crm_businesses(id,workspace_id,name) values ('00000000-0000-4000-8000-000000000231','00000000-0000-4000-8000-000000000221','Prospect');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000211","role":"authenticated","aal":"aal2"}',true);
do $$ declare a jsonb;b jsonb; w uuid:='00000000-0000-4000-8000-000000000221';begin
 a:=public.crm_convert_client(w,'00000000-0000-4000-8000-000000000231',1,'00000000-0000-4000-8000-000000000241');
 b:=public.crm_convert_client(w,'00000000-0000-4000-8000-000000000231',1,'00000000-0000-4000-8000-000000000242');
 if a->'value'->>'id' is distinct from b->'value'->>'id' or (select count(*) from public.crm_clients)<>1 then raise exception 'Conversion duplicated';end if;
 if exists(select 1 from public.crm_client_tools) then raise exception 'Conversion invented subscriptions';end if;
 b:=public.crm_save_client(w,'{"name":"Direct client","relationship_owner":null,"venue_id":null,"status":"active"}',null,'00000000-0000-4000-8000-000000000243');
 if b->>'ok'<>'true' or (select count(*) from public.crm_businesses where origin='outreach')<>1 then raise exception 'Client creation inflated outreach';end if;
 a:=public.crm_save_billing(w,jsonb_build_object('client_id',a->'value'->>'id','reference','INV-1','amount_minor',10000,'paid_minor',0,'currency','AUD','due_on','2026-10-01'),null,'00000000-0000-4000-8000-000000000244');
 if a->>'ok'<>'true' then raise exception 'Billing save failed';end if;
 a:=public.crm_save_billing(w,jsonb_build_object('client_id',b->'value'->>'id','reference','PAID-1','amount_minor',100,'paid_minor',100,'currency','AUD','due_on','2026-10-01'),null,'00000000-0000-4000-8000-000000000246');
 if a->'value'->>'version'<>'1' or a->'value'->>'settled_at' is null then raise exception 'Paid create has wrong version or no settlement';end if;
 begin
 perform public.crm_save_client(w,'{"id":"00000000-0000-4000-8000-000000000299","status":"active","venue_id":null,"relationship_owner":null}',1,'00000000-0000-4000-8000-000000000245');
 raise exception 'Unknown client accepted';exception when no_data_found then null;end;
end $$;
reset role;rollback;

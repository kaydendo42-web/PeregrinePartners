begin;
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000411');insert into public.platform_owners(user_id) values ('00000000-0000-4000-8000-000000000411');
insert into public.crm_workspaces(id,slug,name,kind) values ('00000000-0000-4000-8000-000000000421','large-import','Test','internal');
insert into public.crm_workspace_members(workspace_id,user_id,display_name) values ('00000000-0000-4000-8000-000000000421','00000000-0000-4000-8000-000000000411','Founder');
set local role authenticated;select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000411","role":"authenticated","aal":"aal2"}',true);
create temporary table crm_test_timing(seconds numeric);
do $$ declare w uuid:='00000000-0000-4000-8000-000000000421';batch uuid;result jsonb;chunk jsonb;i int;started timestamptz;begin
 result:=public.crm_begin_import(w,'{"filename":"synthetic-5000.csv","byte_count":200000,"row_count":5000,"source_digest":"synthetic","columns":[{"index":0,"label":"Business","key":"business:0"},{"index":1,"label":"Phone","key":"phone:1"}],"mapping":{"name":0,"phone":1}}','00000000-0000-4000-8000-000000000441');batch:=(result->'value'->>'id')::uuid;
 for i in 0..49 loop
 select jsonb_agg(jsonb_build_object('rowNumber',n,'source',jsonb_build_array('Business '||n,'0'||n))) into chunk from generate_series(i*100+1,i*100+100)n;
 perform public.crm_stage_import(w,batch,chunk);end loop;
 started:=clock_timestamp();result:=public.crm_commit_import(w,batch,'00000000-0000-4000-8000-000000000442');insert into crm_test_timing values(extract(epoch from clock_timestamp()-started));
 if result->'value'->>'created'<>'5000' or result->'value'->>'total'<>'5000' or (select count(*) from public.crm_businesses)<>5000 or (select count(*) from public.crm_contacts)<>5000 then raise exception 'Large import reconciliation failed';end if;
end $$;
select jsonb_build_object('local_5000_row_publish_seconds',seconds,'verification','synthetic PostgreSQL only; live timeout unverified') verification from crm_test_timing;
reset role;rollback;

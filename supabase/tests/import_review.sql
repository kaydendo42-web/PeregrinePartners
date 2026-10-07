begin;
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000511');
insert into public.platform_owners(user_id) values ('00000000-0000-4000-8000-000000000511');
insert into public.crm_workspaces(id,slug,name,kind) values ('00000000-0000-4000-8000-000000000521','import-review','Test','internal');
insert into public.crm_workspace_members(workspace_id,user_id,display_name) values ('00000000-0000-4000-8000-000000000521','00000000-0000-4000-8000-000000000511','Founder');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000511","role":"authenticated","aal":"aal2"}',true);
do $$
declare w uuid:='00000000-0000-4000-8000-000000000521'; b uuid; second uuid; input jsonb; source jsonb; result jsonb; preview jsonb; failures text[]:='{}';
begin
  input:='{"filename":"metadata.csv","byte_count":200,"row_count":2,"source_digest":"test","columns":[{"index":0,"label":"Business","key":"business:0"},{"index":1,"label":"Phone","key":"phone:1"},{"index":2,"label":"Alternative name","key":"alternative:2"}],"mapping":{"name":0,"phone":1}}';
  source:='[{"rowNumber":1,"source":["First cafe","0412","First corrected cafe"]},{"rowNumber":2,"source":["Second cafe","0413","Second corrected cafe"]}]';
  result:=public.crm_begin_import(w,input,gen_random_uuid()); b:=(result->'value'->>'id')::uuid;
  perform public.crm_stage_import(w,b,source); perform public.crm_commit_import(w,b,gen_random_uuid());
  result:=public.crm_begin_import(w,jsonb_set(input,'{columns,0,key}','"cosmetic:999"'),gen_random_uuid()); second:=(result->'value'->>'id')::uuid;
  perform public.crm_stage_import(w,second,source); perform public.crm_commit_import(w,second,gen_random_uuid());
  if (select count(*) from public.crm_businesses where workspace_id=w)<>2 or (select state from public.crm_import_batches where id=second)<>'reused' then failures:=array_append(failures,'Cosmetic column keys published the same source twice');end if;
  result:=public.crm_begin_import(w,jsonb_set(input,'{mapping,name}','2'),gen_random_uuid()); second:=(result->'value'->>'id')::uuid;
  perform public.crm_stage_import(w,second,source); result:=public.crm_commit_import(w,second,gen_random_uuid());
  if result->'value'->>'created'<>'2' then failures:=array_append(failures,'Corrected mapping was silently treated as exact duplicate source');end if;

  input:='{"filename":"branches.csv","byte_count":200,"row_count":3,"source_digest":"test","columns":[{"index":0,"label":"Business","key":"business:0"},{"index":1,"label":"Location","key":"location:1"},{"index":2,"label":"Website","key":"website:2"},{"index":3,"label":"Contact","key":"contact:3"},{"index":4,"label":"Rating","key":"rating:4"}],"mapping":{"name":0,"location":1,"website":2,"contact_name":3}}';
  source:='[{"rowNumber":1,"source":["Example brand","A","https://example.test","First contact","4.8"]},{"rowNumber":2,"source":["Example brand","A","https://example.test","Second contact","4.2"]},{"rowNumber":3,"source":["Different branch","B","https://example.test","Branch contact","4.6"]}]';
  result:=public.crm_begin_import(w,input,gen_random_uuid()); b:=(result->'value'->>'id')::uuid;
  perform public.crm_stage_import(w,b,source); preview:=public.crm_preview_import(w,b,1);
  if jsonb_array_length(preview->'rows'->0->'candidates')=0 or jsonb_array_length(preview->'rows'->2->'candidates')=0 then failures:=array_append(failures,'Same-file shared-domain branches were not flagged');end if;
  begin
    perform public.crm_decide_import(w,b,'[{"rowNumber":2,"decision":"link_contact","targetBusinessId":null,"targetContactId":null,"targetSourceRow":1}]');
    perform public.crm_decide_import(w,b,'[{"rowNumber":1,"decision":"skip","targetBusinessId":null,"targetContactId":null}]');
    if (public.crm_preview_import(w,b,1)->>'blocked')::int=0 then failures:=array_append(failures,'Link to skipped staged root was not blocking');end if;
    begin perform public.crm_commit_import(w,b,gen_random_uuid());failures:=array_append(failures,'Invalid staged link published');exception when check_violation then null;end;
    perform public.crm_decide_import(w,b,'[{"rowNumber":1,"decision":"import","targetBusinessId":null,"targetContactId":null}]');
    result:=public.crm_commit_import(w,b,gen_random_uuid());
    if result->'value'->>'created'<>'2' or result->'value'->>'linked'<>'1' then failures:=array_append(failures,'Staged contact consolidation counts do not reconcile');end if;
    if not exists(select 1 from public.crm_businesses where workspace_id=w and name='Different branch' and location='B') then failures:=array_append(failures,'Separate branch was merged');end if;
    if not exists(select 1 from public.crm_contacts where workspace_id=w and name='Second contact' and source_fields->>'Rating [5]'='4.2') then failures:=array_append(failures,'Linked contact source fields lost');end if;
  exception when check_violation then failures:=array_append(failures,'Staged contact linking unavailable: '||SQLERRM);end;

  input:='{"filename":"url.csv","byte_count":100,"row_count":1,"source_digest":"test","columns":[{"index":0,"label":"Business","key":"business:0"},{"index":1,"label":"Website","key":"website:1"}],"mapping":{"name":0,"website":1}}';
  result:=public.crm_begin_import(w,input,gen_random_uuid());b:=(result->'value'->>'id')::uuid;
  perform public.crm_stage_import(w,b,'[{"rowNumber":1,"source":["URL business","HTTPS://example.com/CasePath"]}]');preview:=public.crm_preview_import(w,b,1);
  if preview->>'blocked'<>'0' then failures:=array_append(failures,'Valid uppercase scheme blocked in preview');end if;
  begin
    perform public.crm_commit_import(w,b,gen_random_uuid());
    if not exists(select 1 from public.crm_businesses where workspace_id=w and name='URL business' and website='https://example.com/CasePath' and source_fields->>'Website [2]'='HTTPS://example.com/CasePath') then failures:=array_append(failures,'URL normalization lost path case or original source');end if;
  exception when check_violation then failures:=array_append(failures,'Valid preview could not publish uppercase URL');end;
  if cardinality(failures)>0 then raise exception 'Import review regressions: %',failures;end if;
end $$;
reset role;
rollback;

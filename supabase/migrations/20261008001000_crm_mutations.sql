-- Checked RPCs are the only write entry points. Private helpers have no caller grants.
create function public.crm_keys(p_input jsonb,p_allowed text[]) returns void
language plpgsql set search_path=pg_catalog,public as $$ begin
 if jsonb_typeof(p_input)<>'object' or p_input is null or exists(select 1 from jsonb_object_keys(p_input) k where not k=any(p_allowed)) then
 raise exception 'Invalid editable fields' using errcode='23514';end if;
end $$;
create function public.crm_request_start(w uuid,op text,payload jsonb,r uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$ declare old public.crm_mutation_requests; begin
 if not public.crm_can_access(w) then raise exception 'Forbidden' using errcode='42501';end if;
 if r is null then raise exception 'Request ID required' using errcode='23514';end if;
 perform pg_advisory_xact_lock(hashtextextended(w::text||auth.uid()::text||r::text,0));
 select * into old from public.crm_mutation_requests where workspace_id=w and actor_id=auth.uid() and request_id=r;
 if found then
 if old.operation<>op or old.payload_digest<>encode(sha256(convert_to(payload::text,'UTF8')),'hex') then raise exception 'Request ID was already used for a different change' using errcode='23514';end if;
 return old.result;end if;return null;
end $$;
create function public.crm_request_finish(w uuid,op text,payload jsonb,r uuid,result jsonb) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$ begin
 insert into public.crm_mutation_requests values(w,auth.uid(),r,op,encode(sha256(convert_to(payload::text,'UTF8')),'hex'),result);
 return result;
end $$;
create function public.crm_changed_fields(p_before jsonb,p_after jsonb) returns jsonb
language sql immutable set search_path=pg_catalog,public as $$
 select coalesce(jsonb_object_agg(k,jsonb_build_object('before',p_before->k,'after',v)),'{}'::jsonb)
 from jsonb_each(p_after) t(k,v) where p_before->k is distinct from v and k not in ('version','updated_at','updated_by','created_at','created_by');
$$;
create function public.crm_log(w uuid,b uuid,k text,s text,c jsonb,r uuid) returns void
language sql security definer set search_path=pg_catalog,public as $$
 insert into public.crm_activities(workspace_id,business_id,kind,summary,changes,actor_id,request_id)
 values(w,b,k,s,c,auth.uid(),r);
$$;
create function public.crm_business_patch(p jsonb) returns void
language plpgsql set search_path=pg_catalog,public as $$ declare k text; v jsonb; begin
 perform public.crm_keys(p,array['name','location','industry','website','stage','assigned_to','priority','tags','do_not_contact','archived']);
 for k,v in select * from jsonb_each(p) loop
 if k in ('do_not_contact','archived') and jsonb_typeof(v)<>'boolean' then raise exception 'Invalid flag' using errcode='23514';end if;
 if k='tags' and (jsonb_typeof(v)<>'array' or exists(select 1 from jsonb_array_elements(v) e where jsonb_typeof(e)<>'string')) then raise exception 'Invalid tags' using errcode='23514';end if;
 if k in ('name','location','industry','stage','priority') and jsonb_typeof(v)<>'string' then raise exception 'Invalid text field' using errcode='23514';end if;
 if k in ('website','assigned_to') and jsonb_typeof(v) not in ('string','null') then raise exception 'Invalid optional field' using errcode='23514';end if;
 end loop;
end $$;
create function public.crm_conflict(current_record jsonb) returns jsonb language sql immutable as $$
 select jsonb_build_object('ok',false,'kind','conflict','message','Another owner saved a change. Your draft is still here.','current',current_record);
$$;
create function public.crm_create_business(p_workspace uuid,p_input jsonb,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$ declare cached jsonb; row public.crm_businesses; begin
 cached:=public.crm_request_start(p_workspace,'create_business',p_input,p_request_id);if cached is not null then return cached;end if;
 perform public.crm_business_patch(p_input);
 insert into public.crm_businesses(workspace_id,name,location,industry,website,stage,assigned_to,priority,tags,do_not_contact)
 values(p_workspace,btrim(p_input->>'name'),coalesce(p_input->>'location',''),coalesce(p_input->>'industry',''),p_input->>'website',coalesce(p_input->>'stage','new'),(p_input->>'assigned_to')::uuid,coalesce(p_input->>'priority','normal'),coalesce(array(select jsonb_array_elements_text(p_input->'tags')),'{}'),coalesce((p_input->>'do_not_contact')::boolean,false)) returning * into row;
 perform public.crm_log(p_workspace,row.id,'created','Business added','{}',p_request_id);
 return public.crm_request_finish(p_workspace,'create_business',p_input,p_request_id,jsonb_build_object('ok',true,'value',to_jsonb(row)));
end $$;
create function public.crm_update_business(p_workspace uuid,p_id uuid,p_expected_version bigint,p_patch jsonb,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$ declare cached jsonb; payload jsonb; old public.crm_businesses; next public.crm_businesses; begin
 payload:=jsonb_build_object('id',p_id,'version',p_expected_version,'patch',p_patch);
 cached:=public.crm_request_start(p_workspace,'update_business',payload,p_request_id);if cached is not null then return cached;end if;
 perform public.crm_business_patch(p_patch);
 select * into old from public.crm_businesses where workspace_id=p_workspace and id=p_id for update;
 if not found then raise exception 'Unknown business' using errcode='P0002';end if;
 if old.version is distinct from p_expected_version then return public.crm_conflict(to_jsonb(old));end if;
 next:=jsonb_populate_record(old,p_patch);
 update public.crm_businesses set name=btrim(next.name),location=next.location,industry=next.industry,website=next.website,stage=next.stage,assigned_to=next.assigned_to,priority=next.priority,tags=next.tags,do_not_contact=next.do_not_contact,archived=next.archived where id=p_id and workspace_id=p_workspace returning * into next;
 if next.do_not_contact or next.archived then update public.crm_follow_ups set state='cancelled' where workspace_id=p_workspace and business_id=p_id and state='open';end if;
 perform public.crm_log(p_workspace,p_id,'changed','Business updated',public.crm_changed_fields(to_jsonb(old),to_jsonb(next)),p_request_id);
 return public.crm_request_finish(p_workspace,'update_business',payload,p_request_id,jsonb_build_object('ok',true,'value',to_jsonb(next)));
end $$;
create function public.crm_add_activity(p_workspace uuid,p_business uuid,p_input jsonb,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$ declare cached jsonb; payload jsonb; b public.crm_businesses; a public.crm_activities; begin
 payload:=jsonb_build_object('business',p_business,'input',p_input);cached:=public.crm_request_start(p_workspace,'activity',payload,p_request_id);if cached is not null then return cached;end if;
 perform public.crm_keys(p_input,array['kind','channel','occurred_at','summary','mark_replied']);
 if p_input->>'kind' not in ('note','outreach','reply','meeting','proposal') or jsonb_typeof(p_input->'summary')<>'string' or jsonb_typeof(p_input->'mark_replied') not in ('boolean','null') then raise exception 'Invalid activity' using errcode='23514';end if;
 select * into b from public.crm_businesses where workspace_id=p_workspace and id=p_business for update;
 if not found then raise exception 'Unknown business' using errcode='P0002';end if;
 if p_input->>'kind'='outreach' and (b.do_not_contact or b.archived) then raise exception 'This business cannot receive outreach' using errcode='23514';end if;
 if p_input->>'kind'='outreach' and p_input->>'channel' is null then raise exception 'Choose a channel' using errcode='23514';end if;
 if p_input->>'kind'='reply' and coalesce((p_input->>'mark_replied')::boolean,false) and b.stage not in ('won','lost') then
 update public.crm_businesses set stage='replied' where workspace_id=p_workspace and id=p_business;end if;
 insert into public.crm_activities(workspace_id,business_id,kind,channel,occurred_at,summary,actor_id,request_id,changes)
 values(p_workspace,p_business,p_input->>'kind',p_input->>'channel',(p_input->>'occurred_at')::timestamptz,btrim(p_input->>'summary'),auth.uid(),p_request_id,case when p_input->>'kind'='reply' then jsonb_build_object('requested_replied',coalesce((p_input->>'mark_replied')::boolean,false),'previous_stage',b.stage) else '{}' end) returning * into a;
 return public.crm_request_finish(p_workspace,'activity',payload,p_request_id,jsonb_build_object('ok',true,'value',to_jsonb(a)));
end $$;
create function public.crm_save_contact(p_workspace uuid,p_business uuid,p_input jsonb,p_expected_version bigint,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$ declare cached jsonb; payload jsonb; c public.crm_contacts; identifier uuid; begin
 payload:=jsonb_build_object('business',p_business,'input',p_input,'version',p_expected_version);cached:=public.crm_request_start(p_workspace,'contact',payload,p_request_id);if cached is not null then return cached;end if;
 perform public.crm_keys(p_input,array['id','name','email','phone','is_primary']);
 perform 1 from public.crm_businesses where workspace_id=p_workspace and id=p_business for update;if not found then raise exception 'Unknown business' using errcode='P0002';end if;
 identifier:=(p_input->>'id')::uuid;
 if identifier is not null then
 select * into c from public.crm_contacts where workspace_id=p_workspace and business_id=p_business and id=identifier for update;if not found then raise exception 'Unknown contact' using errcode='P0002';end if;
 if c.version is distinct from p_expected_version then return public.crm_conflict(to_jsonb(c));end if;
 end if;
 if coalesce((p_input->>'is_primary')::boolean,false) then update public.crm_contacts set is_primary=false where workspace_id=p_workspace and business_id=p_business and is_primary and id is distinct from identifier;end if;
 if identifier is null then
 insert into public.crm_contacts(workspace_id,business_id,name,email,phone,is_primary) values(p_workspace,p_business,btrim(coalesce(p_input->>'name','')),nullif(btrim(p_input->>'email'),''),nullif(btrim(p_input->>'phone'),''),coalesce((p_input->>'is_primary')::boolean,false)) returning * into c;
 else update public.crm_contacts set name=btrim(coalesce(p_input->>'name','')),email=nullif(btrim(p_input->>'email'),''),phone=nullif(btrim(p_input->>'phone'),''),is_primary=coalesce((p_input->>'is_primary')::boolean,false) where id=identifier and workspace_id=p_workspace returning * into c;end if;
 perform public.crm_log(p_workspace,p_business,'contact','Contact saved','{}',p_request_id);
 return public.crm_request_finish(p_workspace,'contact',payload,p_request_id,jsonb_build_object('ok',true,'value',to_jsonb(c)));
end $$;
create function public.crm_save_follow_up(p_workspace uuid,p_input jsonb,p_expected_version bigint,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$ declare cached jsonb;payload jsonb;f public.crm_follow_ups;b public.crm_businesses;identifier uuid; begin
 payload:=jsonb_build_object('input',p_input,'version',p_expected_version);cached:=public.crm_request_start(p_workspace,'follow_up',payload,p_request_id);if cached is not null then return cached;end if;
 perform public.crm_keys(p_input,array['id','business_id','assigned_to','due_at','instruction','state']);
 select * into b from public.crm_businesses where workspace_id=p_workspace and id=(p_input->>'business_id')::uuid for update;if not found then raise exception 'Unknown business' using errcode='P0002';end if;
 if p_input->>'state'='open' and (b.do_not_contact or b.archived) then raise exception 'This business cannot receive follow-ups' using errcode='23514';end if;
 identifier:=(p_input->>'id')::uuid;
 if identifier is not null then
 select * into f from public.crm_follow_ups where workspace_id=p_workspace and business_id=b.id and id=identifier for update;if not found then raise exception 'Unknown follow-up' using errcode='P0002';end if;
 if f.version is distinct from p_expected_version then return public.crm_conflict(to_jsonb(f));end if;
 update public.crm_follow_ups set assigned_to=(p_input->>'assigned_to')::uuid,due_at=(p_input->>'due_at')::timestamptz,instruction=btrim(p_input->>'instruction'),state=p_input->>'state' where id=identifier and workspace_id=p_workspace returning * into f;
 else
 insert into public.crm_follow_ups(workspace_id,business_id,assigned_to,due_at,instruction,state) values(p_workspace,b.id,(p_input->>'assigned_to')::uuid,(p_input->>'due_at')::timestamptz,btrim(p_input->>'instruction'),p_input->>'state') returning * into f;end if;
 perform public.crm_log(p_workspace,b.id,'follow_up','Follow-up saved',jsonb_build_object('due_at',f.due_at,'state',f.state,'instruction',f.instruction),p_request_id);
 return public.crm_request_finish(p_workspace,'follow_up',payload,p_request_id,jsonb_build_object('ok',true,'value',to_jsonb(f)));
end $$;
create function public.crm_bulk_businesses(p_workspace uuid,p_items jsonb,p_patch jsonb,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$ declare cached jsonb;payload jsonb;i jsonb;b public.crm_businesses;result jsonb:='[]';r jsonb;begin
 payload:=jsonb_build_object('items',p_items,'patch',p_patch);cached:=public.crm_request_start(p_workspace,'bulk',payload,p_request_id);if cached is not null then return cached;end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 100 then raise exception 'Select between 1 and 100 records' using errcode='23514';end if;
 if (select count(distinct x->>'id') from jsonb_array_elements(p_items) x)<>jsonb_array_length(p_items) then raise exception 'Repeated selection' using errcode='23514';end if;
 perform public.crm_keys(p_patch,array['assigned_to','stage','tags']);perform public.crm_business_patch(p_patch);
 for i in select x from jsonb_array_elements(p_items) x order by x->>'id' loop
 select * into b from public.crm_businesses where workspace_id=p_workspace and id=(i->>'id')::uuid for update;
 if not found then raise exception 'Unknown business' using errcode='P0002';end if;
 if b.version is distinct from (i->>'version')::bigint then return public.crm_conflict(to_jsonb(b));end if;end loop;
 for i in select x from jsonb_array_elements(p_items) x order by x->>'id' loop
 r:=public.crm_update_business(p_workspace,(i->>'id')::uuid,(i->>'version')::bigint,p_patch,gen_random_uuid());result:=result||jsonb_build_array(r->'value');end loop;
 return public.crm_request_finish(p_workspace,'bulk',payload,p_request_id,jsonb_build_object('ok',true,'value',result));
end $$;

create view public.crm_business_summary with(security_invoker=true) as
 select b.*,
 (select max(a.occurred_at) from public.crm_activities a where a.workspace_id=b.workspace_id and a.business_id=b.id and a.kind in ('outreach','reply')) as last_contact,
 (select min(f.due_at) from public.crm_follow_ups f where f.workspace_id=b.workspace_id and f.business_id=b.id and f.state='open' and not b.do_not_contact and not b.archived) as next_follow_up,
 not exists(select 1 from public.crm_contacts c where c.workspace_id=b.workspace_id and c.business_id=b.id and (c.email is not null or c.phone is not null)) as incomplete_contact,
 (select m.display_name from public.crm_workspace_members m where m.workspace_id=b.workspace_id and m.user_id=b.updated_by) as updated_by_name
 from public.crm_businesses b;
grant select on public.crm_business_summary to authenticated;
revoke all on public.crm_business_summary from anon,public;
do $$ declare f record; begin
 for f in select oid::regprocedure signature,proname from pg_proc where pronamespace='public'::regnamespace and proname like 'crm_%' and proname not in ('crm_owner_status','crm_can_access') loop
 execute format('revoke all on function %s from public,anon,authenticated',f.signature);
 if f.proname in ('crm_create_business','crm_update_business','crm_add_activity','crm_save_contact','crm_save_follow_up','crm_bulk_businesses') then execute format('grant execute on function %s to authenticated',f.signature);end if;
 end loop;
end $$;

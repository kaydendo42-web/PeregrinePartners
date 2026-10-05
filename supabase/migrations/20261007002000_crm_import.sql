-- Imports are private staging until one atomic publication transaction completes.
create function public.crm_normalize_import(cols jsonb,mapping jsonb,source jsonb) returns jsonb
language plpgsql immutable set search_path=pg_catalog,public as $$
declare n text;loc text;industry text;person text;em text;ph text;web text;notes text;taglist text[];issues jsonb:='[]';extras jsonb:='{}';fields jsonb:='{}';c jsonb;label text;key text;val text;begin
 n:=btrim(coalesce(source->>(mapping->>'name')::int,''));loc:=btrim(coalesce(source->>(mapping->>'location')::int,''));industry:=btrim(coalesce(source->>(mapping->>'industry')::int,''));person:=btrim(coalesce(source->>(mapping->>'contact_name')::int,''));em:=nullif(btrim(source->>(mapping->>'email')::int),'');ph:=nullif(btrim(source->>(mapping->>'phone')::int),'');web:=nullif(btrim(source->>(mapping->>'website')::int),'');notes:=btrim(coalesce(source->>(mapping->>'notes')::int,''));
 foreach key in array array['name','location','industry','contact_name'] loop
 val:=case key when 'name' then n when 'location' then loc when 'industry' then industry else person end;
 if length(val)>300 or (key='name' and val='') then issues:=issues||jsonb_build_array(jsonb_build_object('field',key,'severity','error','message','Business name is required; structured text must fit 300 characters.'));end if;end loop;
 if length(notes)>10000 then issues:=issues||jsonb_build_array(jsonb_build_object('field','notes','severity','error','message','Notes exceed 10,000 characters.'));end if;
 if em is not null and (length(em)>320 or em !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then em:=null;issues:=issues||jsonb_build_array(jsonb_build_object('field','email','severity','warning','message','Invalid email; original source retained.'));end if;
 if ph is not null and (length(ph)>100 or ph !~ '^[+0-9(][0-9[:space:]().-]*$') then ph:=null;issues:=issues||jsonb_build_array(jsonb_build_object('field','phone','severity','warning','message','Invalid phone; original source retained.'));end if;
 if web is not null and (length(web)>2000 or web !~* '^https?://[a-z0-9.-]+(:[0-9]{1,5})?([/?#][^[:space:]]*)?$') then web:=null;issues:=issues||jsonb_build_array(jsonb_build_object('field','website','severity','warning','message','Invalid website; original source retained.'));end if;
 select coalesce(array_agg(distinct btrim(v)) filter(where btrim(v)<>''),'{}') into taglist from regexp_split_to_table(coalesce(source->>(mapping->>'tags')::int,''),'[,;]')v;
 if cardinality(taglist)>20 or exists(select 1 from unnest(taglist)t where length(t)>80) then issues:=issues||jsonb_build_array(jsonb_build_object('field','tags','severity','error','message','Use at most 20 tags of 80 characters.'));end if;
 for c in select value from jsonb_array_elements(cols) loop
 label:=(c->>'label')||' ['||((c->>'index')::int+1)::text||']';
 fields:=fields||jsonb_build_object(label,source->>(c->>'index')::int);
 if not exists(select 1 from jsonb_each(mapping)m where m.value=c->'index') then extras:=extras||jsonb_build_object(label,source->>(c->>'index')::int);end if;end loop;
 return jsonb_build_object('source',source,'source_fields',fields,'business',jsonb_build_object('name',n,'location',loc,'industry',industry,'website',web,'tags',taglist),'contact',jsonb_build_object('name',person,'email',em,'phone',ph),'notes',notes,'extra',extras,'issues',issues);
end $$;
create function public.crm_import_fingerprint(p_workspace uuid,p_batch uuid) returns text
language sql stable security definer set search_path=pg_catalog,public as $$
 select encode(sha256(convert_to(jsonb_build_object('columns',b.columns,'mapping',b.mapping,'rows',
 (select jsonb_agg(r.source order by r.row_number) from public.crm_import_rows r where r.workspace_id=p_workspace and r.batch_id=p_batch))::text,'UTF8')),'hex')
 from public.crm_import_batches b where b.workspace_id=p_workspace and b.id=p_batch;
$$;
create function public.crm_import_status(p_workspace uuid,p_batch uuid) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$ declare b public.crm_import_batches;begin
 if not public.crm_can_access(p_workspace) then raise exception 'Forbidden' using errcode='42501';end if;
 select * into b from public.crm_import_batches where workspace_id=p_workspace and id=p_batch;if not found then raise exception 'Unknown import' using errcode='P0002';end if;
 return jsonb_build_object('batch',to_jsonb(b),'staged',(select count(*) from public.crm_import_rows where workspace_id=p_workspace and batch_id=p_batch));
end $$;
create function public.crm_begin_import(p_workspace uuid,p_input jsonb,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$ declare cached jsonb;b public.crm_import_batches;c jsonb;i bigint;begin
 cached:=public.crm_request_start(p_workspace,'begin_import',p_input,p_request_id);if cached is not null then return cached;end if;
 perform public.crm_keys(p_input,array['filename','byte_count','row_count','source_digest','columns','mapping']);
 if jsonb_typeof(p_input->'columns')<>'array' or jsonb_array_length(p_input->'columns') not between 1 and 200 or octet_length(p_input::text)>262144 then raise exception 'Invalid columns or file metadata' using errcode='23514';end if;
 for c,i in select value,ordinality-1 from jsonb_array_elements(p_input->'columns') with ordinality loop
 if c->'index'<>to_jsonb(i) or jsonb_typeof(c->'label')<>'string' or length(c->>'label') not between 1 and 300 or jsonb_typeof(c->'key')<>'string' then raise exception 'Invalid source header' using errcode='23514';end if;end loop;
 perform public.crm_keys(p_input->'mapping',array['name','location','industry','contact_name','email','phone','website','tags','notes']);
 if p_input->'mapping'->>'name' is null then raise exception 'Map business name' using errcode='23514';end if;
 for c in select value from jsonb_each(p_input->'mapping') loop
 if c<>'null'::jsonb and (jsonb_typeof(c)<>'number' or c::text !~ '^\d+$' or c::int not between 0 and jsonb_array_length(p_input->'columns')-1) then raise exception 'Invalid mapping index' using errcode='23514';end if;end loop;
 if (select count(*) from jsonb_each(p_input->'mapping') where value<>'null'::jsonb)<>(select count(distinct value) from jsonb_each(p_input->'mapping') where value<>'null'::jsonb) then raise exception 'Each column can be used once' using errcode='23514';end if;
 insert into public.crm_import_batches(workspace_id,filename,byte_count,row_count,source_digest,columns,mapping) values(p_workspace,p_input->>'filename',(p_input->>'byte_count')::int,(p_input->>'row_count')::int,p_input->>'source_digest',p_input->'columns',p_input->'mapping') returning * into b;
 return public.crm_request_finish(p_workspace,'begin_import',p_input,p_request_id,jsonb_build_object('ok',true,'value',to_jsonb(b)));
end $$;
create function public.crm_stage_import(p_workspace uuid,p_batch uuid,p_rows jsonb) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$ declare b public.crm_import_batches;r jsonb;number int;normalized jsonb;existing jsonb;fingerprint text;begin
 if not public.crm_can_access(p_workspace) then raise exception 'Forbidden' using errcode='42501';end if;
 select * into b from public.crm_import_batches where workspace_id=p_workspace and id=p_batch for update;if not found then raise exception 'Unknown import' using errcode='P0002';end if;
 if b.state<>'staging' then raise exception 'This import can no longer accept source rows' using errcode='23514';end if;
 if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows) not between 1 and 100 or octet_length(jsonb_build_object('batch',p_batch,'rows',p_rows)::text)>262144 then raise exception 'Chunk exceeds limits' using errcode='23514';end if;
 for r in select value from jsonb_array_elements(p_rows) loop
 perform public.crm_keys(r,array['rowNumber','source']);number:=(r->>'rowNumber')::int;
 if number not between 1 and b.row_count or jsonb_typeof(r->'source')<>'array' or jsonb_array_length(r->'source')<>jsonb_array_length(b.columns) or octet_length((r->'source')::text)>131072 or exists(select 1 from jsonb_array_elements(r->'source')x where jsonb_typeof(x)<>'string') then raise exception 'Invalid source row' using errcode='23514';end if;
 select source into existing from public.crm_import_rows where workspace_id=p_workspace and batch_id=p_batch and row_number=number;
 if found then if existing<>r->'source' then raise exception 'Source row changed during retry' using errcode='23514';end if;
 else
 normalized:=public.crm_normalize_import(b.columns,b.mapping,r->'source');fingerprint:=encode(sha256(convert_to(jsonb_build_array(b.columns,r->'source')::text,'UTF8')),'hex');
 insert into public.crm_import_rows(workspace_id,batch_id,row_number,source,normalized,row_fingerprint,issues) values(p_workspace,p_batch,number,r->'source',normalized,fingerprint,normalized->'issues');end if;end loop;
 if (select sum(octet_length(source::text)) from public.crm_import_rows where workspace_id=p_workspace and batch_id=p_batch)>10485760 then raise exception 'Staged source exceeds 10 MiB' using errcode='23514';end if;
 return jsonb_build_object('ok',true,'value',public.crm_import_status(p_workspace,p_batch));
end $$;
create function public.crm_import_blocked(p_workspace uuid,p_batch uuid) returns bigint
language sql stable security definer set search_path=pg_catalog,public as $$
 select count(*) from public.crm_import_rows r where workspace_id=p_workspace and batch_id=p_batch and decision<>'skip' and
 (exists(select 1 from jsonb_array_elements(issues)i where i->>'severity'='error') or
 (decision='link_contact' and (target_business_id is null or coalesce(normalized->'contact'->>'name','')='' and normalized->'contact'->>'email' is null and normalized->'contact'->>'phone' is null)));
$$;
create function public.crm_preview_import(p_workspace uuid,p_batch uuid,p_page int default 1) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$ declare b public.crm_import_batches;rows jsonb;staged bigint;begin
 if not public.crm_can_access(p_workspace) then raise exception 'Forbidden' using errcode='42501';end if;
 if p_page<1 or p_page>100 then raise exception 'Invalid preview page' using errcode='23514';end if;
 select * into b from public.crm_import_batches where workspace_id=p_workspace and id=p_batch for update;if not found then raise exception 'Unknown import' using errcode='P0002';end if;
 select count(*) into staged from public.crm_import_rows where workspace_id=p_workspace and batch_id=p_batch;
 if b.state='staging' and staged=b.row_count then update public.crm_import_batches set state='ready',fingerprint=public.crm_import_fingerprint(p_workspace,p_batch) where workspace_id=p_workspace and id=p_batch returning * into b;end if;
 select coalesce(jsonb_agg(x),'[]') into rows from (
 select r.normalized||jsonb_build_object('rowNumber',r.row_number,'decision',r.decision,'targetBusinessId',r.target_business_id,'targetContactId',r.target_contact_id,
 'exactDuplicate',exists(select 1 from public.crm_import_rows accepted where accepted.workspace_id=p_workspace and accepted.row_fingerprint=r.row_fingerprint and (accepted.published_at is not null or accepted.batch_id=p_batch and accepted.row_number<r.row_number and accepted.decision<>'skip')),
 'candidates',(select coalesce(jsonb_agg(candidate),'[]') from(select biz.id,biz.name,biz.location,array['Possible business/contact match'] reasons,false exact,null::int as "rowNumber"
 from public.crm_businesses biz where biz.workspace_id=p_workspace and not biz.archived and (
 lower(biz.name)=lower(r.normalized->'business'->>'name') or
 biz.website is not null and lower(substring(biz.website from '^https?://([^/?#]+)'))=lower(substring(r.normalized->'business'->>'website' from '^https?://([^/?#]+)')) or
 exists(select 1 from public.crm_contacts ct where ct.workspace_id=p_workspace and ct.business_id=biz.id and (ct.email is not null and lower(ct.email)=lower(r.normalized->'contact'->>'email') or ct.phone is not null and regexp_replace(ct.phone,'[^+0-9]','','g')=regexp_replace(r.normalized->'contact'->>'phone','[^+0-9]','','g')))) order by biz.name,biz.id limit 5)candidate)) x
 from public.crm_import_rows r where r.workspace_id=p_workspace and r.batch_id=p_batch order by r.row_number limit 50 offset (p_page-1)*50) q;
 return jsonb_build_object('rows',rows,'total',b.row_count,'blocked',public.crm_import_blocked(p_workspace,p_batch),'page',p_page,'ready',b.state='ready');
end $$;
create function public.crm_decide_import(p_workspace uuid,p_batch uuid,p_decisions jsonb) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$ declare b public.crm_import_batches;d jsonb;target uuid;contact uuid;begin
 if not public.crm_can_access(p_workspace) then raise exception 'Forbidden' using errcode='42501';end if;
 select * into b from public.crm_import_batches where workspace_id=p_workspace and id=p_batch for update;if not found then raise exception 'Unknown import' using errcode='P0002';end if;
 if b.state not in ('staging','ready') or jsonb_typeof(p_decisions)<>'array' or jsonb_array_length(p_decisions)>100 or octet_length(p_decisions::text)>262144 then raise exception 'Decisions unavailable or too large' using errcode='23514';end if;
 for d in select value from jsonb_array_elements(p_decisions) loop
 perform public.crm_keys(d,array['rowNumber','decision','targetBusinessId','targetContactId']);if d->>'decision' not in ('import','skip','link_contact') then raise exception 'Invalid decision' using errcode='23514';end if;
 target:=(d->>'targetBusinessId')::uuid;contact:=(d->>'targetContactId')::uuid;
 if d->>'decision'='link_contact' then
 if target is null or not exists(select 1 from public.crm_businesses where workspace_id=p_workspace and id=target and not archived) then raise exception 'Choose a business in this workspace' using errcode='23514';end if;
 if contact is not null and not exists(select 1 from public.crm_contacts where workspace_id=p_workspace and business_id=target and id=contact) then raise exception 'Choose a contact on this business' using errcode='23514';end if;
 else target:=null;contact:=null;end if;
 update public.crm_import_rows set decision=d->>'decision',target_business_id=target,target_contact_id=contact where workspace_id=p_workspace and batch_id=p_batch and row_number=(d->>'rowNumber')::int;
 if not found then raise exception 'Unknown source row' using errcode='P0002';end if;end loop;
 return jsonb_build_object('ok',true,'value',public.crm_preview_import(p_workspace,p_batch,1));
end $$;
create function public.crm_commit_import(p_workspace uuid,p_batch uuid,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare b public.crm_import_batches;prior public.crm_import_batches;cached jsonb;payload jsonb;v_fingerprint text;v_counts jsonb;begin
 payload:=jsonb_build_object('batch',p_batch);cached:=public.crm_request_start(p_workspace,'commit_import',payload,p_request_id);if cached is not null then return cached;end if;
 select * into b from public.crm_import_batches where workspace_id=p_workspace and id=p_batch for update;if not found then raise exception 'Unknown import' using errcode='P0002';end if;
 if b.state in ('committed','reused') then return public.crm_request_finish(p_workspace,'commit_import',payload,p_request_id,jsonb_build_object('ok',true,'value',b.counts));end if;
 if b.state='cancelled' then raise exception 'Import cancelled' using errcode='23514';end if;
 if (select count(*) from public.crm_import_rows where workspace_id=p_workspace and batch_id=p_batch)<>b.row_count then raise exception 'Staging is incomplete' using errcode='23514';end if;
 v_fingerprint:=public.crm_import_fingerprint(p_workspace,p_batch);perform pg_advisory_xact_lock(hashtextextended(p_workspace::text,0));
 select * into prior from public.crm_import_batches where workspace_id=p_workspace and crm_import_batches.fingerprint=v_fingerprint and state='committed';
 if found then
 update public.crm_import_batches set state='reused',fingerprint=v_fingerprint,duplicate_of=prior.id,counts=prior.counts where workspace_id=p_workspace and id=p_batch;
 return public.crm_request_finish(p_workspace,'commit_import',payload,p_request_id,jsonb_build_object('ok',true,'value',prior.counts));end if;
 if public.crm_import_blocked(p_workspace,p_batch)>0 then raise exception 'Resolve or skip blocking rows' using errcode='23514';end if;
 update public.crm_import_rows set outcome='skipped' where workspace_id=p_workspace and batch_id=p_batch and decision='skip';
 with ranked as(select row_number,row_number() over(partition by row_fingerprint order by row_number) position from public.crm_import_rows where workspace_id=p_workspace and batch_id=p_batch and decision<>'skip')
 update public.crm_import_rows r set outcome='duplicate' from ranked q where r.workspace_id=p_workspace and r.batch_id=p_batch and r.row_number=q.row_number and (q.position>1 or exists(select 1 from public.crm_import_rows accepted where accepted.workspace_id=p_workspace and accepted.row_fingerprint=r.row_fingerprint and accepted.published_at is not null));
 with chosen as materialized(select r.*,
 case when decision='import' then gen_random_uuid() else target_business_id end bid,
 case when target_contact_id is not null then target_contact_id when coalesce(normalized->'contact'->>'name','')<>'' or normalized->'contact'->>'email' is not null or normalized->'contact'->>'phone' is not null then gen_random_uuid() else null end cid
 from public.crm_import_rows r where workspace_id=p_workspace and batch_id=p_batch and outcome is null),
 businesses as(insert into public.crm_businesses(id,workspace_id,name,location,industry,website,tags,source_fields,import_batch_id,source_row)
 select bid,p_workspace,normalized->'business'->>'name',normalized->'business'->>'location',normalized->'business'->>'industry',normalized->'business'->>'website',array(select jsonb_array_elements_text(normalized->'business'->'tags')),normalized->'source_fields',p_batch,row_number from chosen where decision='import' returning id),
 contacts as(insert into public.crm_contacts(id,workspace_id,business_id,name,email,phone,is_primary,source_fields)
 select c.cid,p_workspace,c.bid,c.normalized->'contact'->>'name',c.normalized->'contact'->>'email',c.normalized->'contact'->>'phone',c.decision='import',c.normalized->'source_fields' from chosen c left join businesses inserted_business on inserted_business.id=c.bid where c.cid is not null and c.target_contact_id is null and (c.decision='link_contact' or inserted_business.id is not null) returning id),
 notes as(insert into public.crm_activities(workspace_id,business_id,kind,summary,changes,actor_id,request_id)
 select p_workspace,c.bid,'import_note',case when c.normalized->>'notes'<>'' then c.normalized->>'notes' else 'Imported contact source attached' end,jsonb_build_object('batch',p_batch,'source_row',c.row_number,'source_fields',c.normalized->'source_fields'),auth.uid(),p_request_id from chosen c left join businesses inserted_business on inserted_business.id=c.bid where (c.normalized->>'notes'<>'' or c.target_contact_id is not null) and (c.decision='link_contact' or inserted_business.id is not null) returning id)
 update public.crm_import_rows r set published_at=now(),target_business_id=c.bid,target_contact_id=c.cid,outcome=case when c.decision='import' then 'created' else 'linked' end from chosen c left join businesses inserted_business on inserted_business.id=c.bid left join contacts ct on ct.id=c.cid where r.workspace_id=p_workspace and r.batch_id=p_batch and r.row_number=c.row_number and (c.decision='link_contact' or inserted_business.id is not null);
 select jsonb_build_object('created',count(*) filter(where outcome='created'),'linked',count(*) filter(where outcome='linked'),'duplicates',count(*) filter(where outcome='duplicate'),'skipped',count(*) filter(where outcome='skipped'),'rejected',count(*) filter(where outcome='rejected'),'total',count(*)) into v_counts from public.crm_import_rows where workspace_id=p_workspace and batch_id=p_batch;
 if exists(select 1 from public.crm_import_rows where workspace_id=p_workspace and batch_id=p_batch and outcome is null) then raise exception 'Import reconciliation failed';end if;
 update public.crm_import_batches set state='committed',fingerprint=v_fingerprint,counts=v_counts where workspace_id=p_workspace and id=p_batch;
 perform public.crm_log(p_workspace,null,'import','Business import completed',v_counts||jsonb_build_object('batch',p_batch),p_request_id);
 return public.crm_request_finish(p_workspace,'commit_import',payload,p_request_id,jsonb_build_object('ok',true,'value',v_counts));
end $$;
create function public.crm_cancel_import(p_workspace uuid,p_batch uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$ declare b public.crm_import_batches;begin
 if not public.crm_can_access(p_workspace) then raise exception 'Forbidden' using errcode='42501';end if;
 select * into b from public.crm_import_batches where workspace_id=p_workspace and id=p_batch for update;if not found then raise exception 'Unknown import' using errcode='P0002';end if;
 if b.state in ('committed','reused') then raise exception 'Completed imports cannot be cancelled' using errcode='23514';end if;
 update public.crm_import_batches set state='cancelled' where workspace_id=p_workspace and id=p_batch returning * into b;
 return jsonb_build_object('ok',true,'value',to_jsonb(b));
end $$;
do $$ declare f record;begin
 for f in select oid::regprocedure signature,proname from pg_proc where pronamespace='public'::regnamespace and proname in ('crm_normalize_import','crm_import_fingerprint','crm_import_blocked','crm_import_status','crm_begin_import','crm_stage_import','crm_preview_import','crm_decide_import','crm_commit_import','crm_cancel_import') loop
 execute format('revoke all on function %s from public,anon,authenticated',f.signature);
 if f.proname not in ('crm_normalize_import','crm_import_fingerprint','crm_import_blocked') then execute format('grant execute on function %s to authenticated',f.signature);end if;end loop;
end $$;

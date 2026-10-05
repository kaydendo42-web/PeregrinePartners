-- Keep import publication linear when fresh tables have no planner statistics.
-- A row-keyed root map and grouped first-contact selection avoid repeated CTE
-- scans. Aggregate dependencies execute business/contact inserts before their
-- references are published; every write still commits or rolls back together.
create or replace function public.crm_commit_import(p_workspace uuid,p_batch uuid,p_request_id uuid) returns jsonb
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
 perform id from public.crm_businesses where workspace_id=p_workspace and id in (select target_business_id from public.crm_import_rows where workspace_id=p_workspace and batch_id=p_batch and decision='link_contact') order by id for update;
 if public.crm_import_blocked(p_workspace,p_batch)>0 then raise exception 'Resolve or skip blocking rows' using errcode='23514';end if;
 update public.crm_import_rows set outcome='skipped' where workspace_id=p_workspace and batch_id=p_batch and decision='skip';
 with ranked as(select row_number,row_number() over(partition by row_fingerprint order by row_number) position from public.crm_import_rows where workspace_id=p_workspace and batch_id=p_batch and decision<>'skip')
 update public.crm_import_rows r set outcome='duplicate' from ranked q where r.workspace_id=p_workspace and r.batch_id=p_batch and r.row_number=q.row_number and (q.position>1 or exists(select 1 from public.crm_import_rows accepted where accepted.workspace_id=p_workspace and accepted.row_fingerprint=r.row_fingerprint and accepted.published_at is not null));
 with prepared as materialized(select r.*,
 case when decision='import' then gen_random_uuid() else null end proposed_bid,
 case when target_contact_id is not null then target_contact_id when coalesce(normalized->'contact'->>'name','')<>'' or normalized->'contact'->>'email' is not null or normalized->'contact'->>'phone' is not null then gen_random_uuid() else null end cid
 from public.crm_import_rows r where workspace_id=p_workspace and batch_id=p_batch and outcome is null),
 selected as materialized(select p.*,min(row_number) filter(where target_source_row is not null and cid is not null) over(partition by target_source_row) first_link from prepared p),
 roots as materialized(select jsonb_object_agg(row_number::text,jsonb_build_object('bid',proposed_bid,'contact',cid)) records from prepared where decision='import'),
 chosen as materialized(select s.*,case when s.decision='import' then s.proposed_bid else coalesce(s.target_business_id,(root.records->s.target_source_row::text->>'bid')::uuid) end bid,
 s.decision='import' or (s.target_source_row is not null and root.records->s.target_source_row::text->>'contact' is null and s.row_number=s.first_link) primary_contact
 from selected s cross join roots root),
 businesses as(insert into public.crm_businesses(id,workspace_id,name,location,industry,website,tags,source_fields,import_batch_id,source_row)
 select bid,p_workspace,normalized->'business'->>'name',normalized->'business'->>'location',normalized->'business'->>'industry',normalized->'business'->>'website',array(select jsonb_array_elements_text(normalized->'business'->'tags')),normalized->'source_fields',p_batch,row_number from chosen where decision='import' returning id),
 contacts as(insert into public.crm_contacts(id,workspace_id,business_id,name,email,phone,is_primary,source_fields)
 select c.cid,p_workspace,c.bid,c.normalized->'contact'->>'name',c.normalized->'contact'->>'email',c.normalized->'contact'->>'phone',c.primary_contact,c.normalized->'source_fields' from chosen c cross join (select count(*) completed from businesses) inserted_business where c.cid is not null and c.target_contact_id is null and inserted_business.completed>=0 returning id),
 notes as(insert into public.crm_activities(workspace_id,business_id,kind,summary,changes,actor_id,request_id)
 select p_workspace,c.bid,'import_note',case when c.normalized->>'notes'<>'' then c.normalized->>'notes' else 'Imported contact source attached' end,jsonb_build_object('batch',p_batch,'source_row',c.row_number,'source_fields',c.normalized->'source_fields'),auth.uid(),p_request_id from chosen c cross join (select count(*) completed from businesses) inserted_business where (c.normalized->>'notes'<>'' or c.decision='link_contact') and inserted_business.completed>=0 returning id)
 update public.crm_import_rows r set published_at=now(),target_business_id=c.bid,target_contact_id=c.cid,outcome=case when c.decision='import' then 'created' else 'linked' end from chosen c cross join (select count(*) completed from businesses) inserted_business cross join (select count(*) completed from contacts) inserted_contacts where r.workspace_id=p_workspace and r.batch_id=p_batch and r.row_number=c.row_number and inserted_business.completed>=0 and inserted_contacts.completed>=0;
 select jsonb_build_object('created',count(*) filter(where outcome='created'),'linked',count(*) filter(where outcome='linked'),'duplicates',count(*) filter(where outcome='duplicate'),'skipped',count(*) filter(where outcome='skipped'),'rejected',count(*) filter(where outcome='rejected'),'total',count(*)) into v_counts from public.crm_import_rows where workspace_id=p_workspace and batch_id=p_batch;
 if exists(select 1 from public.crm_import_rows where workspace_id=p_workspace and batch_id=p_batch and outcome is null) then raise exception 'Import reconciliation failed';end if;
 update public.crm_import_batches set state='committed',fingerprint=v_fingerprint,counts=v_counts where workspace_id=p_workspace and id=p_batch;
 perform public.crm_log(p_workspace,null,'import','Business import completed',v_counts||jsonb_build_object('batch',p_batch),p_request_id);
 return public.crm_request_finish(p_workspace,'commit_import',payload,p_request_id,jsonb_build_object('ok',true,'value',v_counts));
end $$;

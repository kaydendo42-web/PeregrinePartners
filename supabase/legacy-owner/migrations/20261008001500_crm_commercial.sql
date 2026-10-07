create function public.crm_convert_client(p_workspace uuid,p_business uuid,p_expected_version bigint,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$ declare cached jsonb;payload jsonb;b public.crm_businesses;c public.crm_clients;begin
 payload:=jsonb_build_object('business',p_business,'version',p_expected_version);cached:=public.crm_request_start(p_workspace,'convert',payload,p_request_id);if cached is not null then return cached;end if;
 select * into b from public.crm_businesses where workspace_id=p_workspace and id=p_business for update;if not found then raise exception 'Unknown business' using errcode='P0002';end if;
 select * into c from public.crm_clients where workspace_id=p_workspace and business_id=p_business;
 if not found then
 if b.version is distinct from p_expected_version then return public.crm_conflict(to_jsonb(b));end if;
 insert into public.crm_clients(workspace_id,business_id,relationship_owner) values(p_workspace,p_business,b.assigned_to) returning * into c;
 update public.crm_businesses set stage='won' where workspace_id=p_workspace and id=p_business;
 perform public.crm_log(p_workspace,p_business,'converted','Converted to client',jsonb_build_object('client_id',c.id),p_request_id);end if;
 return public.crm_request_finish(p_workspace,'convert',payload,p_request_id,jsonb_build_object('ok',true,'value',to_jsonb(c)));
end $$;
create function public.crm_save_client(p_workspace uuid,p_input jsonb,p_expected_version bigint,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$ declare cached jsonb;payload jsonb;c public.crm_clients;bid uuid;vid uuid;begin
 payload:=jsonb_build_object('input',p_input,'version',p_expected_version);cached:=public.crm_request_start(p_workspace,'client',payload,p_request_id);if cached is not null then return cached;end if;
 perform public.crm_keys(p_input,array['id','name','venue_id','relationship_owner','status']);
 vid:=(p_input->>'venue_id')::uuid;if vid is not null and not exists(select 1 from public.venue_members where venue_id=vid and user_id=auth.uid()) then raise exception 'Venue access required' using errcode='23514';end if;
 if p_input->>'id' is null then
 insert into public.crm_businesses(workspace_id,origin,name,stage) values(p_workspace,'client',btrim(p_input->>'name'),'won') returning id into bid;
 insert into public.crm_clients(workspace_id,business_id,venue_id,relationship_owner,status) values(p_workspace,bid,vid,(p_input->>'relationship_owner')::uuid,p_input->>'status') returning * into c;
 else
 select * into c from public.crm_clients where workspace_id=p_workspace and id=(p_input->>'id')::uuid for update;if not found then raise exception 'Unknown client' using errcode='P0002';end if;
 if c.version is distinct from p_expected_version then return public.crm_conflict(to_jsonb(c));end if;
 update public.crm_clients set venue_id=vid,relationship_owner=(p_input->>'relationship_owner')::uuid,status=p_input->>'status' where workspace_id=p_workspace and id=c.id returning * into c;end if;
 perform public.crm_log(p_workspace,c.business_id,'client','Client account saved',jsonb_build_object('status',c.status),p_request_id);
 return public.crm_request_finish(p_workspace,'client',payload,p_request_id,jsonb_build_object('ok',true,'value',to_jsonb(c)));
end $$;
create function public.crm_save_tool(p_workspace uuid,p_input jsonb,p_expected_version bigint,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$ declare cached jsonb;payload jsonb;t public.crm_tool_catalog;begin
 payload:=jsonb_build_object('input',p_input,'version',p_expected_version);cached:=public.crm_request_start(p_workspace,'tool',payload,p_request_id);if cached is not null then return cached;end if;
 perform public.crm_keys(p_input,array['id','slug','name','availability','archived']);
 if p_input->>'id' is null then
 insert into public.crm_tool_catalog(workspace_id,slug,name,availability,archived) values(p_workspace,p_input->>'slug',btrim(p_input->>'name'),p_input->>'availability',coalesce((p_input->>'archived')::boolean,false)) returning * into t;
 else
 select * into t from public.crm_tool_catalog where workspace_id=p_workspace and id=(p_input->>'id')::uuid for update;if not found then raise exception 'Unknown tool' using errcode='P0002';end if;if t.version is distinct from p_expected_version then return public.crm_conflict(to_jsonb(t));end if;
 update public.crm_tool_catalog set name=btrim(p_input->>'name'),slug=p_input->>'slug',availability=p_input->>'availability',archived=(p_input->>'archived')::boolean where workspace_id=p_workspace and id=t.id returning * into t;end if;
 perform public.crm_log(p_workspace,null,'tool','Tool catalogue updated',jsonb_build_object('name',t.name),p_request_id);
 return public.crm_request_finish(p_workspace,'tool',payload,p_request_id,jsonb_build_object('ok',true,'value',to_jsonb(t)));
end $$;
create function public.crm_save_client_tool(p_workspace uuid,p_input jsonb,p_expected_version bigint,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$ declare cached jsonb;payload jsonb;t public.crm_client_tools;c public.crm_clients;begin
 payload:=jsonb_build_object('input',p_input,'version',p_expected_version);cached:=public.crm_request_start(p_workspace,'client_tool',payload,p_request_id);if cached is not null then return cached;end if;
 perform public.crm_keys(p_input,array['id','client_id','tool_id','status','amount_minor','currency','cadence','starts_on','ends_on']);
 select * into c from public.crm_clients where workspace_id=p_workspace and id=(p_input->>'client_id')::uuid;if not found then raise exception 'Unknown client' using errcode='P0002';end if;
 if p_input->>'id' is null then
 if not exists(select 1 from public.crm_tool_catalog where workspace_id=p_workspace and id=(p_input->>'tool_id')::uuid and not archived) then raise exception 'Choose an active tool' using errcode='23514';end if;
 insert into public.crm_client_tools(workspace_id,client_id,tool_id,status,amount_minor,currency,cadence,starts_on,ends_on) values(p_workspace,c.id,(p_input->>'tool_id')::uuid,p_input->>'status',(p_input->>'amount_minor')::bigint,p_input->>'currency',p_input->>'cadence',(p_input->>'starts_on')::date,(p_input->>'ends_on')::date) returning * into t;
 else
 select * into t from public.crm_client_tools where workspace_id=p_workspace and client_id=c.id and id=(p_input->>'id')::uuid for update;if not found then raise exception 'Unknown tool record' using errcode='P0002';end if;if t.version is distinct from p_expected_version then return public.crm_conflict(to_jsonb(t));end if;
 if t.tool_id<>(p_input->>'tool_id')::uuid then raise exception 'Add a new tool record instead' using errcode='23514';end if;
 update public.crm_client_tools set status=p_input->>'status',amount_minor=(p_input->>'amount_minor')::bigint,currency=p_input->>'currency',cadence=p_input->>'cadence',starts_on=(p_input->>'starts_on')::date,ends_on=(p_input->>'ends_on')::date where workspace_id=p_workspace and id=t.id returning * into t;end if;
 perform public.crm_log(p_workspace,c.business_id,'subscription','Tool record saved',jsonb_build_object('tool_id',t.tool_id,'status',t.status),p_request_id);
 return public.crm_request_finish(p_workspace,'client_tool',payload,p_request_id,jsonb_build_object('ok',true,'value',to_jsonb(t)));
end $$;
create function public.crm_save_billing(p_workspace uuid,p_input jsonb,p_expected_version bigint,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$ declare cached jsonb;payload jsonb;b public.crm_billing_records;c public.crm_clients;begin
 payload:=jsonb_build_object('input',p_input,'version',p_expected_version);cached:=public.crm_request_start(p_workspace,'billing',payload,p_request_id);if cached is not null then return cached;end if;
 perform public.crm_keys(p_input,array['id','client_id','reference','amount_minor','paid_minor','currency','due_on']);
 if jsonb_typeof(p_input->'amount_minor')<>'number' or jsonb_typeof(p_input->'paid_minor')<>'number' or (p_input->>'amount_minor') !~ '^\d+$' or (p_input->>'paid_minor') !~ '^\d+$' then raise exception 'Invalid minor-unit amounts' using errcode='23514';end if;
 select * into c from public.crm_clients where workspace_id=p_workspace and id=(p_input->>'client_id')::uuid;if not found then raise exception 'Unknown client' using errcode='P0002';end if;
 if p_input->>'id' is null then
 insert into public.crm_billing_records(workspace_id,client_id,reference,amount_minor,paid_minor,currency,due_on,settled_at) values(p_workspace,c.id,btrim(p_input->>'reference'),(p_input->>'amount_minor')::bigint,(p_input->>'paid_minor')::bigint,p_input->>'currency',(p_input->>'due_on')::date,case when (p_input->>'amount_minor')::bigint=(p_input->>'paid_minor')::bigint then now() else null end) returning * into b;
 else
 select * into b from public.crm_billing_records where workspace_id=p_workspace and client_id=c.id and id=(p_input->>'id')::uuid for update;if not found then raise exception 'Unknown billing record' using errcode='P0002';end if;if b.version is distinct from p_expected_version then return public.crm_conflict(to_jsonb(b));end if;
 update public.crm_billing_records set reference=btrim(p_input->>'reference'),amount_minor=(p_input->>'amount_minor')::bigint,paid_minor=(p_input->>'paid_minor')::bigint,currency=p_input->>'currency',due_on=(p_input->>'due_on')::date,settled_at=case when (p_input->>'amount_minor')::bigint=(p_input->>'paid_minor')::bigint then coalesce(b.settled_at,now()) else null end where workspace_id=p_workspace and id=b.id returning * into b;end if;
 perform public.crm_log(p_workspace,c.business_id,'billing','Manual billing record saved',jsonb_build_object('reference',b.reference,'currency',b.currency,'amount_minor',b.amount_minor,'paid_minor',b.paid_minor),p_request_id);
 return public.crm_request_finish(p_workspace,'billing',payload,p_request_id,jsonb_build_object('ok',true,'value',to_jsonb(b)));
end $$;
create function public.crm_overview(p_workspace uuid) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$ declare today date;begin
 if not public.crm_can_access(p_workspace) then raise exception 'Forbidden' using errcode='42501';end if;
 select (now() at time zone timezone)::date into today from public.crm_workspaces where id=p_workspace;
 return jsonb_build_object(
 'clients',(select count(*) from public.crm_clients where workspace_id=p_workspace and status='active'),
 'prospects',(select count(*) from public.crm_businesses where workspace_id=p_workspace and origin='outreach' and not archived and not do_not_contact),
 'unassigned',(select count(*) from public.crm_businesses where workspace_id=p_workspace and origin='outreach' and not archived and not do_not_contact and assigned_to is null and not do_not_contact),
 'replies',(select count(*) from public.crm_businesses where workspace_id=p_workspace and origin='outreach' and not archived and not do_not_contact and stage='replied'),
 'due',(select count(*) from public.crm_follow_ups f join public.crm_businesses b on b.workspace_id=f.workspace_id and b.id=f.business_id where f.workspace_id=p_workspace and f.state='open' and f.due_at<=now() and not b.archived and not b.do_not_contact),
 'stages',(select coalesce(jsonb_object_agg(stage,n),'{}') from(select stage,count(*) n from public.crm_businesses where workspace_id=p_workspace and origin='outreach' and not archived and not do_not_contact group by stage)s),
 'balances',(select coalesce(jsonb_object_agg(currency,n),'{}') from(select currency,sum(amount_minor-paid_minor)::text n from public.crm_billing_records where workspace_id=p_workspace group by currency)s),
 'overdue',(select coalesce(jsonb_object_agg(currency,n),'{}') from(select currency,sum(amount_minor-paid_minor)::text n from public.crm_billing_records where workspace_id=p_workspace and due_on<today and paid_minor<amount_minor group by currency)s),
 'tools',(select coalesce(jsonb_agg(s),'[]') from(select t.id,t.name,count(ct.id) clients from public.crm_tool_catalog t left join public.crm_client_tools ct on ct.workspace_id=t.workspace_id and ct.tool_id=t.id and ct.status='active' where t.workspace_id=p_workspace and not t.archived group by t.id,t.name order by t.name)s));
end $$;
do $$ declare f record;begin
 for f in select oid::regprocedure signature from pg_proc where pronamespace='public'::regnamespace and proname in ('crm_convert_client','crm_save_client','crm_save_tool','crm_save_client_tool','crm_save_billing','crm_overview') loop
 execute format('revoke all on function %s from public,anon',f.signature);execute format('grant execute on function %s to authenticated',f.signature);end loop;
end $$;
insert into public.crm_tool_catalog(workspace_id,slug,name,availability)
select w.id,t.slug,t.name,t.availability from public.crm_workspaces w cross join (values('bookings','Bookings','available'),('website','Website','planned'),('crm','CRM','planned'),('payments','Payments','planned'),('advertising','Advertising','planned'))t(slug,name,availability) where w.slug='peregrine';

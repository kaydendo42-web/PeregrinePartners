-- Peregrine Internal only. Never apply this chain to Clients - Booking.
-- Workspace, owner identities and catalogue are copied separately, preserving saved IDs.

-- Source contract: 20261008000000_owner_crm.sql
-- Internal CRM: independent from client booking tables and client authentication.
create table public.platform_owners (
 user_id uuid primary key references auth.users(id), active boolean not null default true
);
create table public.crm_workspaces (
 id uuid primary key default gen_random_uuid(), slug text not null unique,
 name text not null check(length(name) between 1 and 300),
 kind text not null check(kind in ('internal','client')), timezone text not null default 'Australia/Melbourne'
);
-- Approved external venue IDs only; no bookings, guests or client credentials.
create table public.crm_booking_links (
 workspace_id uuid not null references public.crm_workspaces(id),
 venue_id uuid not null,
 primary key(workspace_id,venue_id)
);
alter table public.crm_booking_links enable row level security;
revoke all on public.crm_booking_links from public,anon,authenticated;
grant select on public.crm_booking_links to authenticated;

create table public.crm_workspace_members (
 workspace_id uuid not null references public.crm_workspaces(id), user_id uuid not null references auth.users(id),
 display_name text not null check(length(display_name) between 1 and 300),active boolean not null default true,
 primary key(workspace_id,user_id)
);
create index crm_members_user on public.crm_workspace_members(user_id,workspace_id) where active;
create function public.crm_owner_status() returns boolean
 language sql stable security definer set search_path=pg_catalog,public as $$
 select exists(select 1 from public.platform_owners where user_id=(select auth.uid()) and active);
$$;
create function public.crm_can_access(p_workspace uuid) returns boolean
 language sql stable security definer set search_path=pg_catalog,public as $$
 select coalesce((select auth.jwt()->>'aal')='aal2',false)
 and public.crm_owner_status()
 and exists(select 1 from public.crm_workspace_members m join public.crm_workspaces w on w.id=m.workspace_id
 where m.workspace_id=p_workspace and m.user_id=(select auth.uid()) and m.active and w.kind='internal');
$$;
revoke all on function public.crm_owner_status(), public.crm_can_access(uuid) from public,anon;
grant execute on function public.crm_owner_status(), public.crm_can_access(uuid) to authenticated;

create table public.crm_import_batches (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.crm_workspaces(id),
 fingerprint text, source_digest text not null, filename text not null check(length(filename) between 1 and 300),
 byte_count integer not null check(byte_count between 1 and 10485760),row_count integer not null check(row_count between 1 and 5000),
 columns jsonb not null check(jsonb_typeof(columns)='array'), mapping jsonb not null check(jsonb_typeof(mapping)='object'),
 state text not null default 'staging' check(state in ('staging','ready','committed','reused','cancelled')),
 duplicate_of uuid,counts jsonb not null default '{}',version bigint not null default 1 check(version between 1 and 9007199254740991),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id),updated_by uuid references auth.users(id),unique(workspace_id,id),
 foreign key(workspace_id,duplicate_of) references public.crm_import_batches(workspace_id,id),
 check(octet_length(columns::text)<=131072 and octet_length(mapping::text)<=131072)
);
create unique index crm_committed_fingerprint on public.crm_import_batches(workspace_id,fingerprint) where state='committed';
create table public.crm_businesses (
 id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.crm_workspaces(id),
 origin text not null default 'outreach' check(origin in ('outreach','client')),
 name text not null check(length(btrim(name)) between 1 and 300),location text not null default '' check(length(location)<=300),
 industry text not null default '' check(length(industry)<=300),website text check(length(website)<=2000 and website ~ '^https?://'),
 stage text not null default 'new' check(stage in ('new','contacted','replied','meeting_booked','proposal_sent','won','lost')),
 assigned_to uuid,priority text not null default 'normal' check(priority in ('low','normal','high')),
 tags text[] not null default '{}' check(cardinality(tags)<=20),do_not_contact boolean not null default false,
 archived boolean not null default false,source_fields jsonb not null default '{}' check(octet_length(source_fields::text)<=131072),
 import_batch_id uuid,source_row integer check(source_row between 1 and 5000),
 version bigint not null default 1 check(version between 1 and 9007199254740991),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id),updated_by uuid references auth.users(id),unique(workspace_id,id),
 foreign key(workspace_id,assigned_to) references public.crm_workspace_members(workspace_id,user_id),
 foreign key(workspace_id,import_batch_id) references public.crm_import_batches(workspace_id,id)
);
create index crm_business_stage on public.crm_businesses(workspace_id,origin,archived,stage,updated_at desc);
create index crm_business_assignment on public.crm_businesses(workspace_id,assigned_to) where not archived;
create index crm_business_import on public.crm_businesses(workspace_id,import_batch_id,source_row);
create index crm_business_tags on public.crm_businesses using gin(tags);
create table public.crm_contacts (
 id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.crm_workspaces(id),business_id uuid not null,
 name text not null default '' check(length(name)<=300),email text check(length(email)<=320 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 phone text check(length(phone)<=100),is_primary boolean not null default false,
 source_fields jsonb not null default '{}' check(octet_length(source_fields::text)<=131072),
 version bigint not null default 1 check(version between 1 and 9007199254740991),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id),updated_by uuid references auth.users(id),unique(workspace_id,id),
 foreign key(workspace_id,business_id) references public.crm_businesses(workspace_id,id)
);
create unique index crm_primary_contact on public.crm_contacts(workspace_id,business_id) where is_primary;
create index crm_contact_business on public.crm_contacts(workspace_id,business_id);
create table public.crm_activities (
 id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.crm_workspaces(id),business_id uuid,
 kind text not null,channel text check(channel in ('email','phone','sms','social','other')),occurred_at timestamptz not null default now(),
 summary text not null check(length(summary) between 1 and 10000),changes jsonb not null default '{}',
 actor_id uuid not null references auth.users(id),request_id uuid not null,created_at timestamptz not null default now(),
 foreign key(workspace_id,business_id) references public.crm_businesses(workspace_id,id)
);
create index crm_activity_timeline on public.crm_activities(workspace_id,business_id,occurred_at desc);
create table public.crm_follow_ups (
 id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.crm_workspaces(id),business_id uuid not null,assigned_to uuid not null,
 due_at timestamptz not null,instruction text not null check(length(instruction) between 1 and 10000),
 state text not null default 'open' check(state in ('open','done','cancelled')),
 version bigint not null default 1 check(version between 1 and 9007199254740991),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id),updated_by uuid references auth.users(id),unique(workspace_id,id),
 foreign key(workspace_id,business_id) references public.crm_businesses(workspace_id,id),
 foreign key(workspace_id,assigned_to) references public.crm_workspace_members(workspace_id,user_id)
);
create index crm_due on public.crm_follow_ups(workspace_id,state,due_at,assigned_to);
create table public.crm_clients (
 id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.crm_workspaces(id),business_id uuid not null,
 venue_id uuid,relationship_owner uuid,status text not null default 'active' check(status in ('active','paused','closed')),
 version bigint not null default 1 check(version between 1 and 9007199254740991),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id),updated_by uuid references auth.users(id),unique(workspace_id,id),unique(workspace_id,business_id),
 foreign key(workspace_id,business_id) references public.crm_businesses(workspace_id,id),
 foreign key(workspace_id,venue_id) references public.crm_booking_links(workspace_id,venue_id),
 foreign key(workspace_id,relationship_owner) references public.crm_workspace_members(workspace_id,user_id)
);
create table public.crm_tool_catalog (
 id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.crm_workspaces(id),
 slug text not null check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),name text not null check(length(name) between 1 and 300),
 availability text not null default 'planned' check(availability in ('available','planned')),archived boolean not null default false,
 version bigint not null default 1 check(version between 1 and 9007199254740991),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id),updated_by uuid references auth.users(id),unique(workspace_id,id),unique(workspace_id,slug)
);
create table public.crm_client_tools (
 id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.crm_workspaces(id),client_id uuid not null,tool_id uuid not null,
 status text not null default 'active' check(status in ('active','paused','cancelled')),amount_minor bigint check(amount_minor between 0 and 9007199254740991),
 currency text not null default 'AUD' check(currency ~ '^[A-Z]{3}$'),cadence text not null check(cadence in ('monthly','annual','one_off')),
 starts_on date not null,ends_on date,check(ends_on is null or ends_on>=starts_on),
 version bigint not null default 1 check(version between 1 and 9007199254740991),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id),updated_by uuid references auth.users(id),unique(workspace_id,id),
 foreign key(workspace_id,client_id) references public.crm_clients(workspace_id,id),foreign key(workspace_id,tool_id) references public.crm_tool_catalog(workspace_id,id)
);
create table public.crm_billing_records (
 id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.crm_workspaces(id),client_id uuid not null,
 reference text not null check(length(reference) between 1 and 300),amount_minor bigint not null check(amount_minor between 0 and 9007199254740991),
 paid_minor bigint not null default 0 check(paid_minor>=0 and paid_minor<=amount_minor),currency text not null check(currency ~ '^[A-Z]{3}$'),
 due_on date not null,settled_at timestamptz,
 version bigint not null default 1 check(version between 1 and 9007199254740991),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id),updated_by uuid references auth.users(id),unique(workspace_id,id),
 foreign key(workspace_id,client_id) references public.crm_clients(workspace_id,id)
);
create index crm_billing_due on public.crm_billing_records(workspace_id,due_on);
create table public.crm_import_rows (
 workspace_id uuid not null references public.crm_workspaces(id),batch_id uuid not null,row_number integer not null check(row_number between 1 and 5000),
 source jsonb not null check(jsonb_typeof(source)='array' and octet_length(source::text)<=131072),normalized jsonb not null default '{}',
 decision text not null default 'import' check(decision in ('import','skip','link_contact')),target_business_id uuid,target_contact_id uuid,target_source_row integer,
 row_fingerprint text not null,issues jsonb not null default '[]',published_at timestamptz,outcome text,
 primary key(workspace_id,batch_id,row_number),
 foreign key(workspace_id,batch_id) references public.crm_import_batches(workspace_id,id),
 foreign key(workspace_id,target_business_id) references public.crm_businesses(workspace_id,id),
 foreign key(workspace_id,target_contact_id) references public.crm_contacts(workspace_id,id)
 ,foreign key(workspace_id,batch_id,target_source_row) references public.crm_import_rows(workspace_id,batch_id,row_number)
 ,check(target_source_row is null or target_source_row<>row_number)
);
create unique index crm_accepted_source_row on public.crm_import_rows(workspace_id,row_fingerprint) where published_at is not null;
create table public.crm_mutation_requests (
 workspace_id uuid not null references public.crm_workspaces(id),actor_id uuid not null references auth.users(id),request_id uuid not null,
 operation text not null,payload_digest text not null,result jsonb not null,
 primary key(workspace_id,actor_id,request_id)
);

create function public.crm_touch() returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare person uuid; tag text;
begin
 if TG_TABLE_NAME in ('crm_businesses','crm_follow_ups') then person:=new.assigned_to;
 elsif TG_TABLE_NAME='crm_clients' then person:=new.relationship_owner; end if;
 if person is not null and not exists(select 1 from public.crm_workspace_members where workspace_id=new.workspace_id and user_id=person and active) then
  raise exception 'Choose an active workspace member' using errcode='23514'; end if;
 if TG_TABLE_NAME='crm_businesses' then
  foreach tag in array new.tags loop if length(btrim(tag)) not between 1 and 80 then raise exception 'Invalid tag' using errcode='23514';end if;end loop;
 end if;
 if TG_OP='INSERT' then new.version:=1; new.created_at:=now(); new.created_by:=auth.uid();
 else new.id:=old.id;new.workspace_id:=old.workspace_id;new.created_at:=old.created_at;new.created_by:=old.created_by;new.version:=old.version+1;end if;
 new.updated_at:=now();new.updated_by:=auth.uid(); return new;
end $$;
revoke all on function public.crm_touch() from public,anon,authenticated;
do $$ declare t text; begin
 foreach t in array array['crm_businesses','crm_contacts','crm_follow_ups','crm_clients','crm_tool_catalog','crm_client_tools','crm_billing_records','crm_import_batches'] loop
 execute format('create trigger crm_audit before insert or update on public.%I for each row execute function public.crm_touch()',t);
 end loop;
 foreach t in array array['crm_workspace_members','crm_businesses','crm_contacts','crm_activities','crm_follow_ups','crm_clients','crm_tool_catalog','crm_client_tools','crm_billing_records','crm_import_batches','crm_import_rows'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy crm_read on public.%I for select to authenticated using (public.crm_can_access(workspace_id))',t);
 end loop;
end $$;
alter table public.crm_mutation_requests enable row level security;
revoke all on public.crm_mutation_requests from public,anon,authenticated;
alter table public.crm_workspaces enable row level security;
revoke all on public.crm_workspaces from public,anon,authenticated;
grant select on public.crm_workspaces to authenticated;
create policy crm_workspace_read on public.crm_workspaces for select to authenticated using(public.crm_can_access(id));
alter table public.platform_owners enable row level security;
revoke all on public.platform_owners from public,anon,authenticated;
grant select on public.platform_owners to authenticated;
create policy crm_owner_self on public.platform_owners for select to authenticated using(user_id=(select auth.uid()));
create policy crm_booking_link_read on public.crm_booking_links for select to authenticated using(public.crm_can_access(workspace_id));

-- Source contract: 20261008001000_crm_mutations.sql
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

-- Source contract: 20261008001500_crm_commercial.sql
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
 vid:=(p_input->>'venue_id')::uuid;if vid is not null and not exists(select 1 from public.crm_booking_links where workspace_id=p_workspace and venue_id=vid) then raise exception 'Choose an approved booking connection' using errcode='23514';end if;
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
-- Source contract: 20261008002000_crm_import.sql
-- Imports are private staging until one atomic publication transaction completes.
create function public.crm_import_columns(cols jsonb) returns jsonb
language sql immutable set search_path=pg_catalog,public as $$
 select jsonb_agg(jsonb_build_object('index',ordinality-1,'label',value->>'label','key','column:'||(ordinality-1)::text) order by ordinality)
 from jsonb_array_elements(cols) with ordinality;
$$;
create function public.crm_import_domain(url text) returns text
language sql immutable set search_path=pg_catalog,public as $$
 select lower(substring(lower(url) from '^https?://(?:www\.)?([^/:?#]+)'));
$$;
create function public.crm_import_match_reasons(a jsonb,b jsonb) returns text[]
language sql immutable set search_path=pg_catalog,public as $$
 select array_remove(array[
  case when nullif(a->'business'->>'name','') is not null and lower(a->'business'->>'name')=lower(b->'business'->>'name') then 'Business name' end,
  case when a->'contact'->>'email' is not null and lower(a->'contact'->>'email')=lower(b->'contact'->>'email') then 'Email' end,
  case when a->'contact'->>'phone' is not null and regexp_replace(a->'contact'->>'phone','[^+0-9]','','g')=regexp_replace(b->'contact'->>'phone','[^+0-9]','','g') then 'Phone' end,
  case when public.crm_import_domain(a->'business'->>'website') is not null and public.crm_import_domain(a->'business'->>'website')=public.crm_import_domain(b->'business'->>'website') then 'Website domain' end
 ],null);
$$;
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
 if web is not null then web:=lower(split_part(web,':',1))||substring(web from position(':' in web));end if;
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
 select encode(sha256(convert_to(jsonb_build_object('columns',public.crm_import_columns(b.columns),'mapping',jsonb_strip_nulls(b.mapping),'rows',
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
 insert into public.crm_import_batches(workspace_id,filename,byte_count,row_count,source_digest,columns,mapping) values(p_workspace,p_input->>'filename',(p_input->>'byte_count')::int,(p_input->>'row_count')::int,p_input->>'source_digest',public.crm_import_columns(p_input->'columns'),jsonb_strip_nulls(p_input->'mapping')) returning * into b;
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
 normalized:=public.crm_normalize_import(b.columns,b.mapping,r->'source');fingerprint:=encode(sha256(convert_to(jsonb_build_array(public.crm_import_columns(b.columns),jsonb_strip_nulls(b.mapping),r->'source')::text,'UTF8')),'hex');
 insert into public.crm_import_rows(workspace_id,batch_id,row_number,source,normalized,row_fingerprint,issues) values(p_workspace,p_batch,number,r->'source',normalized,fingerprint,normalized->'issues');end if;end loop;
 if (select sum(octet_length(source::text)) from public.crm_import_rows where workspace_id=p_workspace and batch_id=p_batch)>10485760 then raise exception 'Staged source exceeds 10 MiB' using errcode='23514';end if;
 return jsonb_build_object('ok',true,'value',public.crm_import_status(p_workspace,p_batch));
end $$;
create function public.crm_import_blocked(p_workspace uuid,p_batch uuid) returns bigint
language sql stable security definer set search_path=pg_catalog,public as $$
 select count(*) from public.crm_import_rows r
 where r.workspace_id=p_workspace and r.batch_id=p_batch and r.decision<>'skip' and r.published_at is null and (
  exists(select 1 from jsonb_array_elements(r.issues)i where i->>'severity'='error') or
  (r.decision='link_contact' and (
   (coalesce(r.normalized->'contact'->>'name','')='' and r.normalized->'contact'->>'email' is null and r.normalized->'contact'->>'phone' is null) or
   (r.target_source_row is null and not exists(select 1 from public.crm_businesses biz where biz.workspace_id=p_workspace and biz.id=r.target_business_id and not biz.archived)) or
   (r.target_source_row is not null and not exists(
    select 1 from public.crm_import_rows root where root.workspace_id=p_workspace and root.batch_id=p_batch and root.row_number=r.target_source_row and root.row_number<>r.row_number and root.decision='import'
    and not exists(select 1 from jsonb_array_elements(root.issues)i where i->>'severity'='error')
    and not exists(select 1 from public.crm_import_rows accepted where accepted.workspace_id=p_workspace and accepted.row_fingerprint=root.row_fingerprint and (accepted.published_at is not null or accepted.batch_id=p_batch and accepted.row_number<root.row_number and accepted.decision<>'skip'))
   ))
  ))
 );
$$;
create index crm_import_name_match on public.crm_import_rows(workspace_id,batch_id,lower(normalized->'business'->>'name'));
create index crm_import_email_match on public.crm_import_rows(workspace_id,batch_id,lower(normalized->'contact'->>'email'));
create index crm_import_phone_match on public.crm_import_rows(workspace_id,batch_id,regexp_replace(normalized->'contact'->>'phone','[^+0-9]','','g'));
create index crm_import_domain_match on public.crm_import_rows(workspace_id,batch_id,public.crm_import_domain(normalized->'business'->>'website'));
create function public.crm_preview_import(p_workspace uuid,p_batch uuid,p_page int default 1) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare b public.crm_import_batches;rows jsonb;staged bigint;
begin
 if not public.crm_can_access(p_workspace) then raise exception 'Forbidden' using errcode='42501';end if;
 if p_page<1 or p_page>100 then raise exception 'Invalid preview page' using errcode='23514';end if;
 select * into b from public.crm_import_batches where workspace_id=p_workspace and id=p_batch for update;
 if not found then raise exception 'Unknown import' using errcode='P0002';end if;
 select count(*) into staged from public.crm_import_rows where workspace_id=p_workspace and batch_id=p_batch;
 if b.state='staging' and staged=b.row_count then
  update public.crm_import_batches set state='ready',fingerprint=public.crm_import_fingerprint(p_workspace,p_batch) where workspace_id=p_workspace and id=p_batch returning * into b;
 end if;
 select coalesce(jsonb_agg(x),'[]') into rows from (
  select r.normalized||jsonb_build_object('rowNumber',r.row_number,'decision',r.decision,'targetBusinessId',r.target_business_id,'targetContactId',r.target_contact_id,'targetSourceRow',r.target_source_row,
   'exactDuplicate',exists(select 1 from public.crm_import_rows accepted where accepted.workspace_id=p_workspace and accepted.row_fingerprint=r.row_fingerprint and (accepted.published_at is not null or accepted.batch_id=p_batch and accepted.row_number<r.row_number and accepted.decision<>'skip')),
   'candidates',(
    select coalesce(jsonb_agg(candidate),'[]') from (
     (select biz.id,biz.name,biz.location,array['Possible business/contact match'] reasons,false exact,null::int as "rowNumber",true linkable
      from public.crm_businesses biz where biz.workspace_id=p_workspace and not biz.archived and (
       lower(biz.name)=lower(r.normalized->'business'->>'name') or
       public.crm_import_domain(biz.website)=public.crm_import_domain(r.normalized->'business'->>'website') or
       exists(select 1 from public.crm_contacts ct where ct.workspace_id=p_workspace and ct.business_id=biz.id and (ct.email is not null and lower(ct.email)=lower(r.normalized->'contact'->>'email') or ct.phone is not null and regexp_replace(ct.phone,'[^+0-9]','','g')=regexp_replace(r.normalized->'contact'->>'phone','[^+0-9]','','g')))
      ) order by biz.name,biz.id limit 5)
     union all
     (select null::uuid id,s.normalized->'business'->>'name' as name,s.normalized->'business'->>'location' as location,public.crm_import_match_reasons(r.normalized,s.normalized) reasons,s.row_fingerprint=r.row_fingerprint exact,s.row_number as "rowNumber",
      s.decision='import' and not exists(select 1 from jsonb_array_elements(s.issues)i where i->>'severity'='error') and
      not exists(select 1 from public.crm_import_rows accepted where accepted.workspace_id=p_workspace and accepted.row_fingerprint=s.row_fingerprint and (accepted.published_at is not null or accepted.batch_id=p_batch and accepted.row_number<s.row_number and accepted.decision<>'skip')) as linkable
      from public.crm_import_rows s where s.workspace_id=p_workspace and s.batch_id=p_batch and s.row_number<>r.row_number and (
       lower(s.normalized->'business'->>'name')=lower(r.normalized->'business'->>'name') or
       lower(s.normalized->'contact'->>'email')=lower(r.normalized->'contact'->>'email') or
       regexp_replace(s.normalized->'contact'->>'phone','[^+0-9]','','g')=regexp_replace(r.normalized->'contact'->>'phone','[^+0-9]','','g') or
       public.crm_import_domain(s.normalized->'business'->>'website')=public.crm_import_domain(r.normalized->'business'->>'website')
      ) order by s.row_number limit 5)
    )candidate
   )
  ) x from public.crm_import_rows r where r.workspace_id=p_workspace and r.batch_id=p_batch order by r.row_number limit 50 offset (p_page-1)*50
 )q;
 return jsonb_build_object('rows',rows,'total',b.row_count,'blocked',public.crm_import_blocked(p_workspace,p_batch),'page',p_page,'ready',b.state='ready');
end $$;
create function public.crm_decide_import(p_workspace uuid,p_batch uuid,p_decisions jsonb) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare b public.crm_import_batches;d jsonb;target uuid;contact uuid;source_row int;
begin
 if not public.crm_can_access(p_workspace) then raise exception 'Forbidden' using errcode='42501';end if;
 select * into b from public.crm_import_batches where workspace_id=p_workspace and id=p_batch for update;
 if not found then raise exception 'Unknown import' using errcode='P0002';end if;
 if b.state not in ('staging','ready') or jsonb_typeof(p_decisions)<>'array' or jsonb_array_length(p_decisions)>100 or octet_length(p_decisions::text)>262144 then raise exception 'Decisions unavailable or too large' using errcode='23514';end if;
 for d in select value from jsonb_array_elements(p_decisions) loop
  perform public.crm_keys(d,array['rowNumber','decision','targetBusinessId','targetContactId','targetSourceRow']);
  if d->>'decision' not in ('import','skip','link_contact') then raise exception 'Invalid decision' using errcode='23514';end if;
  target:=(d->>'targetBusinessId')::uuid;contact:=(d->>'targetContactId')::uuid;source_row:=(d->>'targetSourceRow')::int;
  if d->>'decision'='link_contact' then
   if (target is null)=(source_row is null) then raise exception 'Choose one existing business or source row' using errcode='23514';end if;
   if source_row is not null then
    if contact is not null or source_row=(d->>'rowNumber')::int or not exists(select 1 from public.crm_import_rows where workspace_id=p_workspace and batch_id=p_batch and row_number=source_row) then raise exception 'Choose another row in this import' using errcode='23514';end if;
   else
    if not exists(select 1 from public.crm_businesses where workspace_id=p_workspace and id=target and not archived) then raise exception 'Choose a business in this workspace' using errcode='23514';end if;
    if contact is not null and not exists(select 1 from public.crm_contacts where workspace_id=p_workspace and business_id=target and id=contact) then raise exception 'Choose a contact on this business' using errcode='23514';end if;
   end if;
  else target:=null;contact:=null;source_row:=null;end if;
  update public.crm_import_rows set decision=d->>'decision',target_business_id=target,target_contact_id=contact,target_source_row=source_row where workspace_id=p_workspace and batch_id=p_batch and row_number=(d->>'rowNumber')::int;
  if not found then raise exception 'Unknown source row' using errcode='P0002';end if;
 end loop;
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
 perform id from public.crm_businesses where workspace_id=p_workspace and id in (select target_business_id from public.crm_import_rows where workspace_id=p_workspace and batch_id=p_batch and decision='link_contact') order by id for update;
 if public.crm_import_blocked(p_workspace,p_batch)>0 then raise exception 'Resolve or skip blocking rows' using errcode='23514';end if;
 update public.crm_import_rows set outcome='skipped' where workspace_id=p_workspace and batch_id=p_batch and decision='skip';
 with ranked as(select row_number,row_number() over(partition by row_fingerprint order by row_number) position from public.crm_import_rows where workspace_id=p_workspace and batch_id=p_batch and decision<>'skip')
 update public.crm_import_rows r set outcome='duplicate' from ranked q where r.workspace_id=p_workspace and r.batch_id=p_batch and r.row_number=q.row_number and (q.position>1 or exists(select 1 from public.crm_import_rows accepted where accepted.workspace_id=p_workspace and accepted.row_fingerprint=r.row_fingerprint and accepted.published_at is not null));
 with selected as materialized(select r.*,
 case when decision='import' then gen_random_uuid() else null end proposed_bid,
 case when target_contact_id is not null then target_contact_id when coalesce(normalized->'contact'->>'name','')<>'' or normalized->'contact'->>'email' is not null or normalized->'contact'->>'phone' is not null then gen_random_uuid() else null end cid
 from public.crm_import_rows r where workspace_id=p_workspace and batch_id=p_batch and outcome is null),
 chosen as materialized(select s.*,case when s.decision='import' then s.proposed_bid else coalesce(s.target_business_id,root.proposed_bid) end bid,
 s.decision='import' or (s.target_source_row is not null and root.cid is null and s.row_number=(select min(other.row_number) from selected other where other.target_source_row=s.target_source_row and other.cid is not null)) primary_contact
 from selected s left join selected root on root.row_number=s.target_source_row and root.decision='import'),
 businesses as(insert into public.crm_businesses(id,workspace_id,name,location,industry,website,tags,source_fields,import_batch_id,source_row)
 select bid,p_workspace,normalized->'business'->>'name',normalized->'business'->>'location',normalized->'business'->>'industry',normalized->'business'->>'website',array(select jsonb_array_elements_text(normalized->'business'->'tags')),normalized->'source_fields',p_batch,row_number from chosen where decision='import' returning id),
 contacts as(insert into public.crm_contacts(id,workspace_id,business_id,name,email,phone,is_primary,source_fields)
 select c.cid,p_workspace,c.bid,c.normalized->'contact'->>'name',c.normalized->'contact'->>'email',c.normalized->'contact'->>'phone',c.primary_contact,c.normalized->'source_fields' from chosen c left join businesses inserted_business on inserted_business.id=c.bid where c.cid is not null and c.target_contact_id is null and (c.decision='link_contact' or inserted_business.id is not null) returning id),
 notes as(insert into public.crm_activities(workspace_id,business_id,kind,summary,changes,actor_id,request_id)
 select p_workspace,c.bid,'import_note',case when c.normalized->>'notes'<>'' then c.normalized->>'notes' else 'Imported contact source attached' end,jsonb_build_object('batch',p_batch,'source_row',c.row_number,'source_fields',c.normalized->'source_fields'),auth.uid(),p_request_id from chosen c left join businesses inserted_business on inserted_business.id=c.bid where (c.normalized->>'notes'<>'' or c.decision='link_contact') and (c.decision='link_contact' or inserted_business.id is not null) returning id)
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
 for f in select oid::regprocedure signature,proname from pg_proc where pronamespace='public'::regnamespace and proname in ('crm_import_columns','crm_import_domain','crm_import_match_reasons','crm_normalize_import','crm_import_fingerprint','crm_import_blocked','crm_import_status','crm_begin_import','crm_stage_import','crm_preview_import','crm_decide_import','crm_commit_import','crm_cancel_import') loop
 execute format('revoke all on function %s from public,anon,authenticated',f.signature);
 if f.proname not in ('crm_import_columns','crm_import_domain','crm_import_match_reasons','crm_normalize_import','crm_import_fingerprint','crm_import_blocked') then execute format('grant execute on function %s to authenticated',f.signature);end if;end loop;
end $$;

-- Source contract: 20261008003000_crm_realtime.sql
-- RLS controls which signed-in sessions can receive these events.
alter publication supabase_realtime add table public.crm_businesses,public.crm_contacts,public.crm_activities,
public.crm_follow_ups,public.crm_clients,public.crm_client_tools,public.crm_billing_records,public.crm_tool_catalog;

-- Source contract: 20261008004000_crm_import_performance.sql
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

-- Source contract: 20261008005000_crm_import_timeout.sql
-- The measured 5,000-row publication takes longer than the default 8s role
-- timeout. PostgREST honors this per-function limit for its RPC transaction;
-- normal authenticated queries retain their existing timeout.
alter function public.crm_commit_import(uuid,uuid,uuid) set statement_timeout = '45s';

-- Source contract: 20261008005001_crm_conflict_search_path.sql
-- Keep the private JSON conflict helper independent of caller search paths.
alter function public.crm_conflict(jsonb) set search_path = pg_catalog;

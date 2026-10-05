-- Additive owner CRM. Booking tables and their permissions are unchanged.
create table public.platform_owners (
 user_id uuid primary key references auth.users(id), active boolean not null default true
);
create table public.crm_workspaces (
 id uuid primary key default gen_random_uuid(), slug text not null unique,
 name text not null check(length(name) between 1 and 300),
 kind text not null check(kind in ('internal','client')), timezone text not null default 'Australia/Melbourne'
);
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
 venue_id uuid references public.venues(id),relationship_owner uuid,status text not null default 'active' check(status in ('active','paused','closed')),
 version bigint not null default 1 check(version between 1 and 9007199254740991),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id),updated_by uuid references auth.users(id),unique(workspace_id,id),unique(workspace_id,business_id),
 foreign key(workspace_id,business_id) references public.crm_businesses(workspace_id,id),
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
 decision text not null default 'import' check(decision in ('import','skip','link_contact')),target_business_id uuid,target_contact_id uuid,
 row_fingerprint text not null,issues jsonb not null default '[]',published_at timestamptz,outcome text,
 primary key(workspace_id,batch_id,row_number),
 foreign key(workspace_id,batch_id) references public.crm_import_batches(workspace_id,id),
 foreign key(workspace_id,target_business_id) references public.crm_businesses(workspace_id,id),
 foreign key(workspace_id,target_contact_id) references public.crm_contacts(workspace_id,id)
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
insert into public.crm_workspaces(slug,name,kind) values ('peregrine','Peregrine Partners','internal');

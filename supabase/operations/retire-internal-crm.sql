-- Clients - Booking ONLY. Do not run until the internal preview's founder
-- sign-in, MFA, record edits and booking reports have passed live acceptance.
-- Reconcile any source changes and take a private rollback export first.
-- This removes the historical INTERNAL copy, never booking/customer tables.
-- Applied migration history and all client Auth/venue memberships are retained.
begin;
do $$ begin
 if to_regclass('public.bookings') is null or to_regclass('public.client_crm_entries') is null then
  raise exception 'This operation requires the existing client booking database';
 end if;
 if not exists(select 1 from public.crm_workspaces where slug='peregrine' and kind='internal') then
  raise exception 'Expected internal source workspace missing';
 end if;
 if exists(select 1 from public.crm_workspaces where kind<>'internal') then
  raise exception 'Source contains a client CRM workspace: stop and review';
 end if;
end $$;
drop view public.crm_business_summary;
drop table public.crm_mutation_requests, public.crm_import_rows,
 public.crm_billing_records, public.crm_client_tools, public.crm_tool_catalog,
 public.crm_clients, public.crm_follow_ups, public.crm_activities,
 public.crm_contacts, public.crm_businesses, public.crm_import_batches,
 public.crm_workspace_members, public.platform_owners, public.crm_workspaces;
do $$ declare r record; begin
 for r in select p.oid::regprocedure as signature from pg_proc p
 join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and left(p.proname,4)='crm_' and p.proname<>'crm_owner_status' loop
  execute format('drop function %s',r.signature);
 end loop;
end $$;
-- Older preview sign-in code may ask this routing question; it holds no data.
create or replace function public.crm_owner_status() returns boolean
 language sql stable security invoker set search_path=pg_catalog as $$ select false $$;
revoke all on function public.crm_owner_status() from public,anon;
grant execute on function public.crm_owner_status() to authenticated;
commit;

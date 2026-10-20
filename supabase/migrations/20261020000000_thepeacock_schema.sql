-- Clients - Booking keeps each client in a schema of its own (vbarbers is
-- V Barbers'), so the venue console's tables move out of public into
-- thepeacock: The Peacock is the only venue on them.
--
-- ALTER ... SET SCHEMA keeps every object's identity, so rows, indexes,
-- constraints, triggers, RLS policies, grants and the realtime publication all
-- come along untouched. Function bodies are text, though: any that name
-- public.<moved object> are rewritten, and each search_path that listed public
-- now lists thepeacock first. btree_gist stays in public, where the extension
-- lives, and so does crm_owner_status() (see operations/retire-internal-crm.sql).
--
-- PostgREST must expose the schema (API settings → exposed schemas), and every
-- client names it: the console's booking client sets db.schema, and the
-- Peacock site sends Accept-Profile / Content-Profile: thepeacock.

create schema thepeacock;

grant usage on schema thepeacock to anon, authenticated, service_role;
alter default privileges in schema thepeacock grant all on tables to anon, authenticated, service_role;
alter default privileges in schema thepeacock grant all on functions to anon, authenticated, service_role;
alter default privileges in schema thepeacock grant all on sequences to anon, authenticated, service_role;

alter table public.venues             set schema thepeacock;
alter table public.venue_members      set schema thepeacock;
alter table public.sections           set schema thepeacock;
alter table public.venue_tables       set schema thepeacock;
alter table public.bookings           set schema thepeacock;
alter table public.table_combinations set schema thepeacock;
alter table public.booking_tables     set schema thepeacock;
alter table public.client_crm_entries set schema thepeacock;
alter view  public.customer_summary   set schema thepeacock;

do $$
declare
  moved constant text :=
    'venues|venue_members|sections|venue_tables|bookings|table_combinations|booking_tables|'
    'client_crm_entries|customer_summary|booking_dashboard|booking_guest_key|bookings_table_ids|'
    'can_manage|client_crm_add_entry|client_crm_customer|client_crm_customers|client_crm_set_state|'
    'client_crm_touch|is_member|sync_booking_tables|touch_updated_at';
  f record;
  def text;
  path text;
begin
  -- Move first, so the rewritten definition replaces the function in place.
  for f in
    select p.oid::regprocedure sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f' and p.proname ~ ('^(' || moved || ')$')
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  loop
    execute format('alter function %s set schema thepeacock', f.sig);
  end loop;

  for f in
    select p.oid, p.oid::regprocedure sig, p.proconfig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'thepeacock' and p.prokind = 'f'
  loop
    def := pg_get_functiondef(f.oid);
    if def ~ ('\mpublic\.(' || moved || ')\M') then
      execute regexp_replace(def, '\mpublic\.(' || moved || ')\M', 'thepeacock.\1', 'g');
    end if;
    path := null;
    select substr(c, length('search_path=') + 1) into path
    from unnest(f.proconfig) c where c like 'search_path=%';
    if path is not null and path ~ '\mpublic\M' and path !~ '\mthepeacock\M' then
      execute format('alter function %s set search_path = %s', f.sig,
        regexp_replace(path, '\mpublic\M', 'thepeacock, public'));
    end if;
  end loop;
end $$;

-- Nothing of the venue console may be left behind in public.
do $$ begin
  if exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'v') and c.relname in
      ('venues','venue_members','sections','venue_tables','bookings','table_combinations','booking_tables','client_crm_entries','customer_summary')
  ) then
    raise exception 'a venue-console relation is still in public';
  end if;
  -- Materialized, so pg_get_functiondef only ever sees plain functions.
  if exists (
    with fns as materialized (
      select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'thepeacock' and p.prokind = 'f'
    )
    select 1 from fns
    where pg_get_functiondef(fns.oid) ~ '\mpublic\.(venues|venue_members|sections|venue_tables|bookings|table_combinations|booking_tables|client_crm_entries|is_member|can_manage)\M'
  ) then
    raise exception 'a moved function still names public';
  end if;
end $$;

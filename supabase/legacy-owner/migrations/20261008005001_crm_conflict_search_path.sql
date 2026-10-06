-- Keep the private JSON conflict helper independent of caller search paths.
alter function public.crm_conflict(jsonb) set search_path = pg_catalog;

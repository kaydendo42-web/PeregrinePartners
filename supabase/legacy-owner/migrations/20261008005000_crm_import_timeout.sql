-- The measured 5,000-row publication takes longer than the default 8s role
-- timeout. PostgREST honors this per-function limit for its RPC transaction;
-- normal authenticated queries retain their existing timeout.
alter function public.crm_commit_import(uuid,uuid,uuid) set statement_timeout = '45s';

-- Rebrand the shared founder workspace; retain its identity and access policies.
update public.crm_workspaces
set name = 'Peregrine Office'
where slug = 'peregrine' and kind = 'internal';

-- Synthetic fixtures only. All fixtures and checks roll back.
begin;
insert into auth.users(id) values
 ('00000000-0000-4000-8000-000000000011'),
 ('00000000-0000-4000-8000-000000000012'),
 ('00000000-0000-4000-8000-000000000013');
insert into public.platform_owners(user_id) values
 ('00000000-0000-4000-8000-000000000011'),
 ('00000000-0000-4000-8000-000000000012');
insert into public.crm_workspaces(id,slug,name,kind) values
 ('00000000-0000-4000-8000-000000000021','test-one','One','internal'),
 ('00000000-0000-4000-8000-000000000022','test-two','Two','internal'),
 ('00000000-0000-4000-8000-000000000023','test-client','Client','client');
insert into public.crm_workspace_members(workspace_id,user_id,display_name) values
 ('00000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000011','Founder One'),
 ('00000000-0000-4000-8000-000000000022','00000000-0000-4000-8000-000000000012','Founder Two'),
 ('00000000-0000-4000-8000-000000000023','00000000-0000-4000-8000-000000000011','Founder One');
insert into public.crm_businesses(id,workspace_id,name) values
 ('00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000021','Business One'),
 ('00000000-0000-4000-8000-000000000032','00000000-0000-4000-8000-000000000022','Business Two'),
 ('00000000-0000-4000-8000-000000000033','00000000-0000-4000-8000-000000000023','Client business');
do $$ begin
  begin
    insert into public.crm_contacts(workspace_id,business_id,name) values
     ('00000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000032','Wrong workspace');
    raise exception 'Cross-workspace contact was accepted';
  exception when foreign_key_violation then null; end;
end $$;
set local role anon;
do $$ begin
  begin perform * from public.crm_businesses; raise exception 'Anonymous read was accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000011","role":"authenticated","aal":"aal1"}',true);
do $$ begin
 if exists(select 1 from public.crm_businesses) then raise exception 'aal1 session saw CRM rows'; end if;
 if not public.crm_owner_status() then raise exception 'Owner routing unavailable before MFA'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000013","role":"authenticated","aal":"aal2"}',true);
do $$ begin
 if exists(select 1 from public.crm_businesses) then raise exception 'Client session saw CRM rows'; end if;
 begin
  insert into public.platform_owners(user_id) values ('00000000-0000-4000-8000-000000000013');
  raise exception 'Owner self-grant accepted';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000011","role":"authenticated","aal":"aal2"}',true);
do $$ begin
 if (select count(*) from public.crm_businesses) <> 1 then raise exception 'Owner scope mismatch'; end if;
 if (select name from public.crm_businesses) <> 'Business One' then raise exception 'Wrong workspace visible'; end if;
 begin
  insert into public.crm_businesses(workspace_id,name,created_by) values
   ('00000000-0000-4000-8000-000000000021','Spoof','00000000-0000-4000-8000-000000000012');
  raise exception 'Direct write or actor spoof accepted';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.crm_workspace_members set active=false where user_id='00000000-0000-4000-8000-000000000011';
do $$ begin
 begin
  update public.crm_businesses set assigned_to='00000000-0000-4000-8000-000000000011' where id='00000000-0000-4000-8000-000000000031';
  raise exception 'Inactive assignment was accepted';
 exception when check_violation then null; end;
end $$;
set local role authenticated;
do $$ begin
 if exists(select 1 from public.crm_businesses) then raise exception 'Revoked member saw rows'; end if;
end $$;
reset role;
rollback;

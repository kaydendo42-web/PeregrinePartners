-- RLS controls which signed-in sessions can receive these events.
alter publication supabase_realtime add table public.crm_businesses,public.crm_contacts,public.crm_activities,
public.crm_follow_ups,public.crm_clients,public.crm_client_tools,public.crm_billing_records,public.crm_tool_catalog;

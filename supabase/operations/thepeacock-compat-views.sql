-- Clients - Booking ONLY, and only for the few minutes of the thepeacock move.
--
-- Applied straight after migrations/20261020000000_thepeacock_schema.sql so the
-- still-running Peacock site and console (which name public) keep reading and
-- writing while their new builds deploy. Each view is a plain pass-through
-- with security_invoker, so the base table's RLS still applies and writes go
-- straight through. Remove with the block at the bottom once both apps are on
-- thepeacock.

create view public.venues             with (security_invoker = true) as select * from thepeacock.venues;
create view public.venue_members      with (security_invoker = true) as select * from thepeacock.venue_members;
create view public.sections           with (security_invoker = true) as select * from thepeacock.sections;
create view public.venue_tables       with (security_invoker = true) as select * from thepeacock.venue_tables;
create view public.bookings           with (security_invoker = true) as select * from thepeacock.bookings;
create view public.table_combinations with (security_invoker = true) as select * from thepeacock.table_combinations;
create view public.booking_tables     with (security_invoker = true) as select * from thepeacock.booking_tables;
create view public.client_crm_entries with (security_invoker = true) as select * from thepeacock.client_crm_entries;

grant select, insert, update, delete on
  public.venues, public.venue_members, public.sections, public.venue_tables, public.bookings,
  public.table_combinations, public.booking_tables, public.client_crm_entries
  to anon, authenticated, service_role;

-- Removal, once both apps are deployed on thepeacock:
--
--   drop view public.venues, public.venue_members, public.sections, public.venue_tables,
--     public.bookings, public.table_combinations, public.booking_tables, public.client_crm_entries;

-- The room around a venue's tables, for the console's floor plan: section
-- outlines, walls, back of house, counters, stairs, trees. Venue metres, the
-- same axes as venue_tables. Null means the console draws the tables alone.
--
-- Written by the venue's seed (for The Peacock, peacock-south-yarra's
-- `npm run peregrine:seed`); members read it with the rest of the venue row.

alter table public.venues add column plan jsonb;

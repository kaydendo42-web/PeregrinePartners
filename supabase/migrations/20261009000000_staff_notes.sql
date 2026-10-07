-- The venue's own notes on a booking ("regular, likes the window", "rang to
-- say running late"). Kept apart from `notes`, which is what the guest wrote
-- when they booked: staff_notes never goes into an email or back to a guest.
--
-- Members already change bookings under "members change bookings", so no new
-- policy. Run before deploying the console build that reads it.

alter table public.bookings add column staff_notes text;

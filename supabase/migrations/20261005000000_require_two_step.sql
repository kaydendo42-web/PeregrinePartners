-- Two-step sign-in, enforced by the database rather than only by the console.
--
-- The console sends a member to /sign-in/verify until their session is aal2
-- (password or email link, then a code from an authenticator app). That check
-- alone would leave a gap: a stolen password still yields an aal1 token, and an
-- aal1 token can talk to Supabase's API directly with the public key. These
-- restrictive policies close it: every member policy now also needs an aal2
-- session, so a password on its own reads nothing.
--
-- The website's booking API uses the service-role key, which bypasses RLS, so
-- guests booking a table are unaffected.

create policy "two-step sign-in required" on public.venues
  as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

create policy "two-step sign-in required" on public.venue_members
  as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

create policy "two-step sign-in required" on public.sections
  as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

create policy "two-step sign-in required" on public.venue_tables
  as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

create policy "two-step sign-in required" on public.bookings
  as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

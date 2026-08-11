-- =====================================================================
-- JhapaRide — Phase 8 fix
-- The previous fix (candidate rider ride visibility) made the `rides`
-- SELECT policy subquery `ride_requests`, but `ride_requests`'s own
-- SELECT policy already subqueries `rides` — a circular RLS dependency
-- that Postgres rejects outright with "infinite recursion detected in
-- policy for relation rides", breaking every profiles/rides/ride_requests
-- read for every signed-in user (profiles' own policy also chains into
-- rides). Break the cycle the same way is_admin() does: move the check
-- into a SECURITY DEFINER function, whose internal query runs as the
-- function owner and so bypasses RLS instead of re-triggering it.
-- =====================================================================

create or replace function public.is_candidate_rider_for_ride(p_ride_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.ride_requests rr
    where rr.ride_id = p_ride_id and rr.rider_id = auth.uid()
  );
$$;

drop policy if exists "rides_select_participants_or_admin" on public.rides;
create policy "rides_select_participants_or_admin" on public.rides
  for select using (
    passenger_id = auth.uid()
    or rider_id = auth.uid()
    or public.is_admin()
    or public.is_candidate_rider_for_ride(id)
  );
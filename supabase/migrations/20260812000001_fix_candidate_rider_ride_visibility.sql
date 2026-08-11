-- =====================================================================
-- JhapaRide — Phase 8 fix
-- A rider who has been sent a ride_request couldn't actually see the
-- ride's pickup/destination/fare, because rides_select_participants_or_admin
-- only allowed rider_id = auth.uid() — which is still null until someone
-- accepts. Extend it to also cover riders with a pending request for the
-- ride, so the requests list can show what it's actually offering.
-- =====================================================================

drop policy if exists "rides_select_participants_or_admin" on public.rides;
create policy "rides_select_participants_or_admin" on public.rides
  for select using (
    passenger_id = auth.uid()
    or rider_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.ride_requests rr
      where rr.ride_id = rides.id and rr.rider_id = auth.uid()
    )
  );
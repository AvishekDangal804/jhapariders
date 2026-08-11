-- =====================================================================
-- JhapaRide — Phase 4 follow-up fix
-- rides_insert_own only checked passenger_id = auth.uid(), which let a
-- malicious client INSERT a ride that was already "ride_completed" with
-- an arbitrary final_fare, or pre-assign a rider_id, bypassing matching
-- entirely. Tighten the WITH CHECK so a client-created ride can only ever
-- start in its correct initial state — every other field transition goes
-- through the SECURITY DEFINER RPCs planned for Phase 8/9.
-- =====================================================================

drop policy if exists "rides_insert_own" on public.rides;
create policy "rides_insert_own" on public.rides
  for insert with check (
    passenger_id = auth.uid()
    and status = 'searching'
    and rider_id is null
    and final_fare is null
    and payment_status = 'pending'
    and coalesce(discount_amount, 0) = 0
  );

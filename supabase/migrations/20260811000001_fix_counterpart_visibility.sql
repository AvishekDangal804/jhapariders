-- =====================================================================
-- JhapaRide — Phase 3 follow-up fix
-- The original profiles_select policy only allowed a user to see their
-- own row. That's too strict: a passenger needs to see their assigned
-- rider's name/avatar (and vice versa) both during an active ride and in
-- ride history. Widen it to any pair that has shared a ride together.
-- Also widen rider_profiles visibility the same way, since it was
-- previously scoped to active-ride statuses only (blocking ride history).
-- =====================================================================

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (
    id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.rides r
      where (r.passenger_id = auth.uid() and r.rider_id = profiles.id)
         or (r.rider_id = auth.uid() and r.passenger_id = profiles.id)
    )
  );

drop policy if exists "rider_profiles_select" on public.rider_profiles;
create policy "rider_profiles_select" on public.rider_profiles
  for select using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.rides r
      where r.rider_id = rider_profiles.user_id
        and r.passenger_id = auth.uid()
    )
  );

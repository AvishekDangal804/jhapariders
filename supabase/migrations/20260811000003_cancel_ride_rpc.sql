-- =====================================================================
-- JhapaRide — Phase 4 addition
-- rides.status can only be changed by an admin per RLS (Phase 3), so a
-- passenger/rider has no way to cancel their own ride through a raw
-- UPDATE. This SECURITY DEFINER RPC is the one narrow, validated escape
-- hatch: it checks the caller is a participant and the ride is still in a
-- cancellable state, then transitions it and records the cancellation.
-- Broader state-transition RPCs (accept/start/complete) land in Phase 8.
-- =====================================================================

create or replace function public.cancel_ride(p_ride_id uuid, p_reason text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_ride record;
  v_role public.cancelled_by_role;
begin
  select * into v_ride from public.rides where id = p_ride_id for update;

  if v_ride is null then
    raise exception 'Ride not found';
  end if;

  if auth.uid() = v_ride.passenger_id then
    v_role := 'passenger';
  elsif auth.uid() = v_ride.rider_id then
    v_role := 'rider';
  else
    raise exception 'Not authorized to cancel this ride';
  end if;

  if v_ride.status not in ('searching', 'driver_assigned', 'driver_arriving', 'driver_arrived') then
    raise exception 'Ride can no longer be cancelled';
  end if;

  update public.rides
  set status = 'cancelled', cancelled_at = now()
  where id = p_ride_id;

  insert into public.cancellations (ride_id, cancelled_by_role, cancelled_by, reason)
  values (p_ride_id, v_role, auth.uid(), p_reason);
end;
$$;

grant execute on function public.cancel_ride(uuid, text) to authenticated;

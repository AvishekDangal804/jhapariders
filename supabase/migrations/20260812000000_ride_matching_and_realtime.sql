-- =====================================================================
-- JhapaRide — Phase 8: ride matching, controlled status transitions, realtime
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Rider matching: finds nearby, verified, online riders with the right
-- vehicle type and creates ride_requests + notifications for them.
-- Called by the passenger right after creating a ride.
-- ---------------------------------------------------------------------

create or replace function public.request_ride_matching(p_ride_id uuid)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_ride record;
  v_radius_km numeric;
  v_count integer := 0;
begin
  select * into v_ride from public.rides where id = p_ride_id for update;

  if v_ride is null then
    raise exception 'Ride not found';
  end if;
  if v_ride.passenger_id <> auth.uid() then
    raise exception 'Not authorized';
  end if;
  if v_ride.status <> 'searching' then
    return 0;
  end if;

  select coalesce(service_radius_km, 5) into v_radius_km from public.system_settings where id = 1;

  insert into public.ride_requests (ride_id, rider_id)
  select p_ride_id, rp.user_id
  from public.rider_profiles rp
  join public.vehicles v on v.rider_id = rp.id and v.status = 'approved'
  where rp.verification_status = 'approved'
    and rp.is_online = true
    and v.type = v_ride.service_type::text::public.vehicle_type
    and rp.current_lat is not null
    and rp.current_lng is not null
    and (
      6371 * acos(
        least(1, greatest(-1,
          cos(radians(v_ride.pickup_lat)) * cos(radians(rp.current_lat)) *
          cos(radians(rp.current_lng) - radians(v_ride.pickup_lng)) +
          sin(radians(v_ride.pickup_lat)) * sin(radians(rp.current_lat))
        ))
      )
    ) <= v_radius_km
  order by rp.rating_avg desc
  limit 5
  on conflict (ride_id, rider_id) do nothing;

  get diagnostics v_count = row_count;

  insert into public.notifications (user_id, type, title, body, data)
  select rider_id, 'ride_request', 'New ride request',
         v_ride.pickup_address || ' -> ' || v_ride.destination_address,
         jsonb_build_object('ride_id', p_ride_id)
  from public.ride_requests
  where ride_id = p_ride_id and status = 'sent';

  if v_count = 0 then
    update public.rides set status = 'no_driver_found' where id = p_ride_id;
  end if;

  return v_count;
end;
$$;

grant execute on function public.request_ride_matching(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 2. Accept / decline. `for update` on the ride row is what actually
-- prevents two riders from accepting the same ride: the second
-- transaction blocks until the first commits, then sees status is no
-- longer 'searching' and aborts.
-- ---------------------------------------------------------------------

create or replace function public.accept_ride_request(p_ride_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_ride record;
begin
  select * into v_ride from public.rides where id = p_ride_id for update;

  if v_ride is null then
    raise exception 'Ride not found';
  end if;
  if v_ride.status <> 'searching' then
    raise exception 'This ride is no longer available';
  end if;
  if not exists (
    select 1 from public.rider_profiles
    where user_id = auth.uid() and verification_status = 'approved' and is_online = true
  ) then
    raise exception 'You must be online and approved to accept rides';
  end if;
  if not exists (
    select 1 from public.ride_requests where ride_id = p_ride_id and rider_id = auth.uid()
  ) then
    raise exception 'This ride was not offered to you';
  end if;

  update public.rides
  set status = 'driver_assigned', rider_id = auth.uid(), accepted_at = now()
  where id = p_ride_id;

  update public.ride_requests
  set status = 'accepted', responded_at = now()
  where ride_id = p_ride_id and rider_id = auth.uid();

  update public.ride_requests
  set status = 'expired', responded_at = now()
  where ride_id = p_ride_id and rider_id <> auth.uid() and status = 'sent';

  insert into public.notifications (user_id, type, title, body, data)
  values (
    v_ride.passenger_id, 'ride_accepted', 'Rider found!',
    'A rider has accepted your ride and is on the way.',
    jsonb_build_object('ride_id', p_ride_id)
  );
end;
$$;

grant execute on function public.accept_ride_request(uuid) to authenticated;

create or replace function public.decline_ride_request(p_ride_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.ride_requests
  set status = 'declined', responded_at = now()
  where ride_id = p_ride_id and rider_id = auth.uid() and status = 'sent';
end;
$$;

grant execute on function public.decline_ride_request(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 3. Controlled ride status progression for the assigned rider. Each
-- transition is validated against the ride's current status — no
-- arbitrary jumps (e.g. straight to ride_completed) are possible.
-- ---------------------------------------------------------------------

create or replace function public.update_ride_progress(p_ride_id uuid, p_status public.ride_status)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_ride record;
  v_allowed boolean := false;
begin
  select * into v_ride from public.rides where id = p_ride_id for update;

  if v_ride is null then
    raise exception 'Ride not found';
  end if;
  if v_ride.rider_id <> auth.uid() then
    raise exception 'Not authorized';
  end if;

  if v_ride.status = 'driver_assigned' and p_status = 'driver_arriving' then v_allowed := true;
  elsif v_ride.status = 'driver_arriving' and p_status = 'driver_arrived' then v_allowed := true;
  elsif v_ride.status = 'driver_arrived' and p_status = 'ride_started' then v_allowed := true;
  elsif v_ride.status = 'ride_started' and p_status = 'ride_completed' then v_allowed := true;
  end if;

  if not v_allowed then
    raise exception 'Invalid status transition from % to %', v_ride.status, p_status;
  end if;

  update public.rides
  set
    status = p_status,
    started_at = case when p_status = 'ride_started' then now() else started_at end,
    completed_at = case when p_status = 'ride_completed' then now() else completed_at end
  where id = p_ride_id;

  insert into public.notifications (user_id, type, title, body, data)
  values (
    v_ride.passenger_id,
    (case p_status
      when 'driver_arriving' then 'rider_arriving'
      when 'driver_arrived' then 'rider_arrived'
      when 'ride_started' then 'ride_started'
      when 'ride_completed' then 'ride_completed'
      else 'system'
    end)::public.notification_type,
    case p_status
      when 'driver_arriving' then 'Your rider is on the way'
      when 'driver_arrived' then 'Your rider has arrived'
      when 'ride_started' then 'Your ride has started'
      when 'ride_completed' then 'Ride completed'
      else 'Ride update'
    end,
    null,
    jsonb_build_object('ride_id', p_ride_id)
  );
end;
$$;

grant execute on function public.update_ride_progress(uuid, public.ride_status) to authenticated;

-- ---------------------------------------------------------------------
-- 4. Realtime: expose row-level changes for the tables the UI subscribes
-- to. RLS still applies to realtime — a client only receives change
-- events for rows its policies already let it SELECT.
-- ---------------------------------------------------------------------

do $$ begin
  alter publication supabase_realtime add table public.rides;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.ride_requests;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.ride_locations;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;

alter table public.rides replica identity full;
alter table public.ride_requests replica identity full;

-- =====================================================================
-- JhapaRide — Phase 9 critical fix
-- Every RPC function checked "record_variable IS [NOT] NULL" right after
-- a `SELECT ... INTO record_variable` to test whether a row was found.
-- In this environment that check is unreliable for `record`-typed
-- variables — live testing proved a case where the record's fields were
-- correctly populated (e.g. v_ride.status read back correctly) while
-- `v_ride IS NOT NULL` still evaluated false. This silently skipped the
-- platform wallet's commission credit in pay_for_ride (money-affecting)
-- and could affect the "not found" guards in every other RPC.
--
-- Fix: use PL/pgSQL's built-in FOUND variable (true/false after the most
-- recent SELECT INTO), which tested reliable, instead of checking the
-- record itself. FOUND is captured into a dedicated boolean immediately
-- after each SELECT wherever later statements would otherwise overwrite
-- it before the check is used.
-- =====================================================================

create or replace function public.cancel_ride(p_ride_id uuid, p_reason text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_ride record;
  v_role public.cancelled_by_role;
begin
  select * into v_ride from public.rides where id = p_ride_id for update;
  if not found then
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

create or replace function public.request_ride_matching(p_ride_id uuid)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_ride record;
  v_radius_km numeric;
  v_count integer := 0;
begin
  select * into v_ride from public.rides where id = p_ride_id for update;
  if not found then
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

create or replace function public.accept_ride_request(p_ride_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_ride record;
begin
  select * into v_ride from public.rides where id = p_ride_id for update;
  if not found then
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

create or replace function public.update_ride_progress(p_ride_id uuid, p_status public.ride_status)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_ride record;
  v_allowed boolean := false;
  v_commission_rate numeric;
  v_final_fare numeric;
  v_platform_share numeric;
  v_rider_share numeric;
begin
  select * into v_ride from public.rides where id = p_ride_id for update;
  if not found then
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

  if p_status = 'ride_completed' then
    select coalesce(commission_rate, 0.15) into v_commission_rate from public.system_settings where id = 1;
    v_final_fare := coalesce(v_ride.estimated_fare, 0);
    v_platform_share := round(v_final_fare * v_commission_rate, 2);
    v_rider_share := round(v_final_fare - v_platform_share, 2);

    update public.rides
    set status = p_status,
        completed_at = now(),
        final_fare = v_final_fare,
        commission_rate = v_commission_rate,
        platform_share = v_platform_share,
        rider_share = v_rider_share
    where id = p_ride_id;
  else
    update public.rides
    set status = p_status,
        started_at = case when p_status = 'ride_started' then now() else started_at end
    where id = p_ride_id;
  end if;

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
      when 'ride_completed' then 'Ride completed — payment due'
      else 'Ride update'
    end,
    null,
    jsonb_build_object('ride_id', p_ride_id)
  );
end;
$$;

create or replace function public.pay_for_ride(p_ride_id uuid, p_method public.payment_method)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_ride record;
  v_passenger_wallet record;
  v_platform_wallet record;
  v_rider_wallet record;
  v_platform_found boolean;
  v_rider_found boolean;
begin
  select * into v_ride from public.rides where id = p_ride_id for update;
  if not found then
    raise exception 'Ride not found';
  end if;
  if v_ride.passenger_id <> auth.uid() then raise exception 'Not authorized'; end if;
  if v_ride.status <> 'ride_completed' then raise exception 'Ride is not awaiting payment'; end if;
  if v_ride.final_fare is null then raise exception 'Fare not finalized yet'; end if;
  if p_method not in ('cash', 'wallet') then raise exception 'Unsupported payment method'; end if;

  if p_method = 'wallet' then
    select * into v_passenger_wallet from public.wallets
      where owner_type = 'passenger' and owner_id = auth.uid() for update;
    if not found or v_passenger_wallet.balance < v_ride.final_fare then
      raise exception 'Insufficient wallet balance';
    end if;

    select * into v_platform_wallet from public.wallets where owner_type = 'platform' for update;
    v_platform_found := found;
    select * into v_rider_wallet from public.wallets
      where owner_type = 'rider' and owner_id = v_ride.rider_id for update;
    v_rider_found := found;

    update public.wallets set balance = balance - v_ride.final_fare, updated_at = now()
      where id = v_passenger_wallet.id;
    insert into public.wallet_transactions (wallet_id, type, amount, balance_after, reference_type, reference_id, description)
    values (v_passenger_wallet.id, 'debit', v_ride.final_fare, v_passenger_wallet.balance - v_ride.final_fare, 'ride', p_ride_id, 'Ride payment');

    if v_rider_found then
      update public.wallets set balance = balance + v_ride.rider_share, updated_at = now()
        where id = v_rider_wallet.id;
      insert into public.wallet_transactions (wallet_id, type, amount, balance_after, reference_type, reference_id, description)
      values (v_rider_wallet.id, 'credit', v_ride.rider_share, v_rider_wallet.balance + v_ride.rider_share, 'ride', p_ride_id, 'Ride earnings');
    end if;

    if v_platform_found then
      update public.wallets set balance = balance + v_ride.platform_share, updated_at = now()
        where id = v_platform_wallet.id;
      insert into public.wallet_transactions (wallet_id, type, amount, balance_after, reference_type, reference_id, description)
      values (v_platform_wallet.id, 'commission', v_ride.platform_share, v_platform_wallet.balance + v_ride.platform_share, 'ride', p_ride_id, 'Platform commission');
    end if;
  end if;

  insert into public.payments (ride_id, passenger_id, amount, commission_amount, rider_amount, method, status, paid_at)
  values (p_ride_id, v_ride.passenger_id, v_ride.final_fare, v_ride.platform_share, v_ride.rider_share, p_method, 'success', now());

  update public.rides set status = 'paid', payment_status = 'success', payment_method = p_method where id = p_ride_id;

  insert into public.notifications (user_id, type, title, body, data)
  values (
    v_ride.rider_id, 'payment_success', 'Payment received',
    'You earned NPR ' || v_ride.rider_share::text || ' from your last ride.',
    jsonb_build_object('ride_id', p_ride_id)
  );
end;
$$;

create or replace function public.demo_topup_wallet(p_amount numeric)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_wallet record;
begin
  if p_amount <= 0 or p_amount > 5000 then
    raise exception 'Top-up amount must be between 1 and 5000';
  end if;

  select * into v_wallet from public.wallets
    where owner_type = 'passenger' and owner_id = auth.uid() for update;
  if not found then
    raise exception 'Wallet not found';
  end if;

  update public.wallets set balance = balance + p_amount, updated_at = now() where id = v_wallet.id;
  insert into public.wallet_transactions (wallet_id, type, amount, balance_after, reference_type, description)
  values (v_wallet.id, 'credit', p_amount, v_wallet.balance + p_amount, 'demo_topup', 'Demo wallet top-up');
end;
$$;

create or replace function public.process_withdrawal(p_withdrawal_id uuid, p_approve boolean, p_notes text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_withdrawal record;
  v_wallet record;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  select * into v_withdrawal from public.withdrawals where id = p_withdrawal_id for update;
  if not found then
    raise exception 'Withdrawal not found';
  end if;
  if v_withdrawal.status <> 'pending' then raise exception 'Withdrawal already processed'; end if;

  if p_approve then
    select * into v_wallet from public.wallets
      where owner_type = 'rider' and owner_id = v_withdrawal.rider_id for update;
    if not found or v_wallet.balance < v_withdrawal.amount then
      raise exception 'Rider has insufficient wallet balance';
    end if;

    update public.wallets set balance = balance - v_withdrawal.amount, updated_at = now() where id = v_wallet.id;
    insert into public.wallet_transactions (wallet_id, type, amount, balance_after, reference_type, reference_id, description)
    values (v_wallet.id, 'withdrawal', v_withdrawal.amount, v_wallet.balance - v_withdrawal.amount, 'withdrawal', p_withdrawal_id, 'Withdrawal payout');

    update public.withdrawals
    set status = 'completed', processed_at = now(), processed_by = auth.uid(), notes = p_notes
    where id = p_withdrawal_id;
  else
    update public.withdrawals
    set status = 'rejected', processed_at = now(), processed_by = auth.uid(), notes = p_notes
    where id = p_withdrawal_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- Clean up the temporary debug functions created while diagnosing this.
-- ---------------------------------------------------------------------
drop function if exists public._debug_get_function_def(text);
drop function if exists public._debug_platform_wallet();
drop function if exists public._debug_pay_repro(uuid);
drop function if exists public._debug_minimal(uuid);
drop function if exists public._debug_minimal2(uuid);
drop function if exists public._debug_minimal3(uuid);
drop function if exists public._debug_found_var(uuid);
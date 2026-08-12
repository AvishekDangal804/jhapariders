-- =====================================================================
-- JhapaRide — Phase 9: payments, wallets, commission
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Extend update_ride_progress: when a ride reaches ride_completed,
-- finalize its fare and commission split from the *current* system
-- settings, snapshotted onto the ride row so later pricing/commission
-- changes never retroactively alter a historical ride.
-- (Real-time distance tracking isn't built yet, so final_fare falls
-- back to the original estimate — a documented simplification.)
-- ---------------------------------------------------------------------

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

-- ---------------------------------------------------------------------
-- 2. Payment. Cash: no wallet movement (rider already holds the cash
-- physically) — the rider's earnings dashboard still reflects it via
-- final_fare on completed rides, independent of the wallet. Wallet:
-- ledgered debit from passenger, credit to rider's share, credit to
-- platform's commission share, all in one transaction.
-- ---------------------------------------------------------------------

create or replace function public.pay_for_ride(p_ride_id uuid, p_method public.payment_method)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_ride record;
  v_passenger_wallet record;
  v_platform_wallet record;
  v_rider_wallet record;
begin
  select * into v_ride from public.rides where id = p_ride_id for update;

  if v_ride is null then raise exception 'Ride not found'; end if;
  if v_ride.passenger_id <> auth.uid() then raise exception 'Not authorized'; end if;
  if v_ride.status <> 'ride_completed' then raise exception 'Ride is not awaiting payment'; end if;
  if v_ride.final_fare is null then raise exception 'Fare not finalized yet'; end if;
  if p_method not in ('cash', 'wallet') then raise exception 'Unsupported payment method'; end if;

  if p_method = 'wallet' then
    select * into v_passenger_wallet from public.wallets
      where owner_type = 'passenger' and owner_id = auth.uid() for update;
    if v_passenger_wallet is null or v_passenger_wallet.balance < v_ride.final_fare then
      raise exception 'Insufficient wallet balance';
    end if;

    select * into v_platform_wallet from public.wallets where owner_type = 'platform' for update;
    select * into v_rider_wallet from public.wallets
      where owner_type = 'rider' and owner_id = v_ride.rider_id for update;

    update public.wallets set balance = balance - v_ride.final_fare, updated_at = now()
      where id = v_passenger_wallet.id;
    insert into public.wallet_transactions (wallet_id, type, amount, balance_after, reference_type, reference_id, description)
    values (v_passenger_wallet.id, 'debit', v_ride.final_fare, v_passenger_wallet.balance - v_ride.final_fare, 'ride', p_ride_id, 'Ride payment');

    if v_rider_wallet is not null then
      update public.wallets set balance = balance + v_ride.rider_share, updated_at = now()
        where id = v_rider_wallet.id;
      insert into public.wallet_transactions (wallet_id, type, amount, balance_after, reference_type, reference_id, description)
      values (v_rider_wallet.id, 'credit', v_ride.rider_share, v_rider_wallet.balance + v_ride.rider_share, 'ride', p_ride_id, 'Ride earnings');
    end if;

    if v_platform_wallet is not null then
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

grant execute on function public.pay_for_ride(uuid, public.payment_method) to authenticated;

-- ---------------------------------------------------------------------
-- 3. Demo wallet top-up. No real payment gateway is configured for this
-- build, so this is an explicit, capped, clearly-demo mechanism for
-- exercising the wallet payment path — not a real money transfer.
-- ---------------------------------------------------------------------

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
  if v_wallet is null then
    raise exception 'Wallet not found';
  end if;

  update public.wallets set balance = balance + p_amount, updated_at = now() where id = v_wallet.id;
  insert into public.wallet_transactions (wallet_id, type, amount, balance_after, reference_type, description)
  values (v_wallet.id, 'credit', p_amount, v_wallet.balance + p_amount, 'demo_topup', 'Demo wallet top-up');
end;
$$;

grant execute on function public.demo_topup_wallet(numeric) to authenticated;

-- ---------------------------------------------------------------------
-- 4. Withdrawal processing (admin). Requests themselves are inserted
-- directly by the rider (withdrawals_insert_own RLS already allows
-- this); only approval/rejection needs elevated privilege since
-- approval must atomically debit the rider's wallet.
-- ---------------------------------------------------------------------

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
  if v_withdrawal is null then raise exception 'Withdrawal not found'; end if;
  if v_withdrawal.status <> 'pending' then raise exception 'Withdrawal already processed'; end if;

  if p_approve then
    select * into v_wallet from public.wallets
      where owner_type = 'rider' and owner_id = v_withdrawal.rider_id for update;
    if v_wallet is null or v_wallet.balance < v_withdrawal.amount then
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

grant execute on function public.process_withdrawal(uuid, boolean, text) to authenticated;

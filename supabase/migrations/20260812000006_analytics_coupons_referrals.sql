-- Phase 11: coupons, referrals, and two small fixes discovered while wiring
-- them up (rider_profiles.total_rides was never incremented anywhere, and
-- there was no configurable referral reward amount).

alter table public.system_settings
  add column if not exists referral_reward_amount numeric(10, 2) not null default 100;

-- ---------------------------------------------------------------------
-- Coupons
-- ---------------------------------------------------------------------

-- compute_coupon_discount: pure calculation shared by preview_coupon_discount
-- (no ride yet, used while reviewing a booking) and apply_coupon_to_ride
-- (authoritative, once the ride exists) so the two can never disagree.
create or replace function public.compute_coupon_discount(
  p_discount_type public.coupon_discount_type,
  p_discount_value numeric,
  p_maximum_discount numeric,
  p_fare numeric
)
returns numeric
language plpgsql immutable as $$
declare
  v_discount numeric(10, 2);
begin
  if p_discount_type = 'flat' then
    v_discount := p_discount_value;
  else
    v_discount := round(p_fare * p_discount_value / 100, 2);
    if p_maximum_discount is not null and v_discount > p_maximum_discount then
      v_discount := p_maximum_discount;
    end if;
  end if;
  if v_discount > p_fare then
    v_discount := p_fare;
  end if;
  return v_discount;
end;
$$;

-- preview_coupon_discount: read-only validation + discount preview for the
-- booking review step, before a ride row exists to attach a coupon to.
create or replace function public.preview_coupon_discount(p_code text, p_fare numeric)
returns numeric
language plpgsql security definer set search_path = public as $$
declare
  v_coupon record;
begin
  select * into v_coupon from public.coupons where upper(code) = upper(p_code);
  if not found then
    raise exception 'Invalid coupon code';
  end if;
  if not v_coupon.is_active then
    raise exception 'This coupon is no longer active';
  end if;
  if v_coupon.expiry_date is not null and v_coupon.expiry_date < now() then
    raise exception 'This coupon has expired';
  end if;
  if v_coupon.usage_limit is not null and v_coupon.usage_count >= v_coupon.usage_limit then
    raise exception 'This coupon has reached its usage limit';
  end if;
  if p_fare < v_coupon.minimum_fare then
    raise exception 'This coupon requires a minimum fare of Rs. %', v_coupon.minimum_fare;
  end if;
  if exists (select 1 from public.coupon_usage where coupon_id = v_coupon.id and user_id = auth.uid()) then
    raise exception 'You have already used this coupon';
  end if;

  return public.compute_coupon_discount(v_coupon.discount_type, v_coupon.discount_value, v_coupon.maximum_discount, p_fare);
end;
$$;

grant execute on function public.preview_coupon_discount(text, numeric) to authenticated;

-- apply_coupon_to_ride: validates a coupon code against a ride the caller
-- owns (still in a pre-ride-start status, so the discount lands before
-- matching/fare gets locked in), computes the discount server-side (never
-- trusts a client-supplied amount), reduces the ride's estimated_fare by
-- it, and records usage. One redemption per coupon per user, enforced here
-- since the table's own unique constraint is only (coupon_id, ride_id).
create or replace function public.apply_coupon_to_ride(p_ride_id uuid, p_code text)
returns numeric
language plpgsql security definer set search_path = public as $$
declare
  v_ride record;
  v_coupon record;
  v_discount numeric(10, 2);
  v_new_fare numeric(10, 2);
begin
  select * into v_ride from public.rides where id = p_ride_id for update;
  if not found then
    raise exception 'Ride not found';
  end if;
  if v_ride.passenger_id <> auth.uid() then
    raise exception 'Not authorized';
  end if;
  if v_ride.status not in ('searching', 'driver_assigned', 'driver_arriving', 'driver_arrived') then
    raise exception 'Coupon can only be applied before the ride starts';
  end if;
  if v_ride.coupon_id is not null then
    raise exception 'A coupon is already applied to this ride';
  end if;
  if v_ride.estimated_fare is null then
    raise exception 'Fare not calculated yet';
  end if;

  select * into v_coupon from public.coupons where upper(code) = upper(p_code) for update;
  if not found then
    raise exception 'Invalid coupon code';
  end if;
  if not v_coupon.is_active then
    raise exception 'This coupon is no longer active';
  end if;
  if v_coupon.expiry_date is not null and v_coupon.expiry_date < now() then
    raise exception 'This coupon has expired';
  end if;
  if v_coupon.usage_limit is not null and v_coupon.usage_count >= v_coupon.usage_limit then
    raise exception 'This coupon has reached its usage limit';
  end if;
  if v_ride.estimated_fare < v_coupon.minimum_fare then
    raise exception 'This coupon requires a minimum fare of Rs. %', v_coupon.minimum_fare;
  end if;
  if exists (select 1 from public.coupon_usage where coupon_id = v_coupon.id and user_id = auth.uid()) then
    raise exception 'You have already used this coupon';
  end if;

  v_discount := public.compute_coupon_discount(v_coupon.discount_type, v_coupon.discount_value, v_coupon.maximum_discount, v_ride.estimated_fare);
  v_new_fare := v_ride.estimated_fare - v_discount;

  update public.rides
  set coupon_id = v_coupon.id, discount_amount = v_discount, estimated_fare = v_new_fare
  where id = p_ride_id;

  update public.coupons set usage_count = usage_count + 1 where id = v_coupon.id;

  insert into public.coupon_usage (coupon_id, user_id, ride_id, discount_amount)
  values (v_coupon.id, auth.uid(), p_ride_id, v_discount);

  return v_discount;
end;
$$;

grant execute on function public.apply_coupon_to_ride(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- Referrals
-- ---------------------------------------------------------------------

-- get_my_referral_code: returns the caller's current unclaimed invite code,
-- generating one if none exists. referred_role is a placeholder until
-- someone actually redeems the code (redeem_referral_code overwrites it
-- with the new signup's real role) — a referrer doesn't pick a role
-- up front, whoever signs up with the code does.
create or replace function public.get_my_referral_code()
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_attempt text;
  v_i int := 0;
begin
  select code into v_code from public.referrals
  where referrer_id = auth.uid() and referred_user_id is null
  limit 1;

  if v_code is not null then
    return v_code;
  end if;

  loop
    v_i := v_i + 1;
    v_attempt := 'JHAPA-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.referrals where code = v_attempt);
    if v_i > 20 then
      raise exception 'Could not generate a unique referral code, try again';
    end if;
  end loop;

  insert into public.referrals (referrer_id, code, referred_role)
  values (auth.uid(), v_attempt, 'passenger');

  return v_attempt;
end;
$$;

grant execute on function public.get_my_referral_code() to authenticated;

-- redeem_referral_code: called right after a new user's first authenticated
-- session (registration, or first login if email confirmation delayed it).
-- Links the code to the new user; the reward itself is granted later, on
-- their first completed ride (see update_ride_progress below), so referrals
-- can't be farmed by signing up without ever actually using the platform.
create or replace function public.redeem_referral_code(p_code text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_referral record;
  v_my_role public.user_role;
begin
  select role into v_my_role from public.profiles where id = auth.uid();
  if v_my_role is null then
    raise exception 'Profile not found';
  end if;

  select * into v_referral from public.referrals
  where upper(code) = upper(p_code) and referred_user_id is null
  for update;

  if not found then
    raise exception 'Invalid or already-used referral code';
  end if;
  if v_referral.referrer_id = auth.uid() then
    raise exception 'You cannot refer yourself';
  end if;
  if exists (select 1 from public.referrals where referred_user_id = auth.uid()) then
    raise exception 'You have already used a referral code';
  end if;

  update public.referrals
  set referred_user_id = auth.uid(), referred_role = v_my_role
  where id = v_referral.id;
end;
$$;

grant execute on function public.redeem_referral_code(text) to authenticated;

-- update_ride_progress: re-declared to add (1) rider_profiles.total_rides
-- tracking, which nothing incremented anywhere despite the column existing
-- since Phase 3, and (2) referral completion + reward payout on a referred
-- user's first completed ride, in either the passenger or rider seat.
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
  v_referral record;
  v_reward_amount numeric(10, 2);
  v_referrer_wallet record;
  v_wallet_txn_id uuid;
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

    update public.rider_profiles
    set total_rides = total_rides + 1, updated_at = now()
    where user_id = v_ride.rider_id;

    for v_referral in
      select * from public.referrals
      where status = 'pending' and referred_user_id in (v_ride.passenger_id, v_ride.rider_id)
    loop
      if (
        v_referral.referred_user_id = v_ride.passenger_id
        and not exists (select 1 from public.rides where passenger_id = v_ride.passenger_id and status = 'ride_completed' and id <> p_ride_id)
      ) or (
        v_referral.referred_user_id = v_ride.rider_id
        and not exists (select 1 from public.rides where rider_id = v_ride.rider_id and status = 'ride_completed' and id <> p_ride_id)
      ) then
        select coalesce(referral_reward_amount, 100) into v_reward_amount from public.system_settings where id = 1;
        select * into v_referrer_wallet from public.wallets where owner_id = v_referral.referrer_id for update;

        if found then
          update public.wallets set balance = balance + v_reward_amount, updated_at = now()
          where id = v_referrer_wallet.id;

          insert into public.wallet_transactions (wallet_id, type, amount, balance_after, reference_type, reference_id, description)
          values (v_referrer_wallet.id, 'credit', v_reward_amount, v_referrer_wallet.balance + v_reward_amount, 'referral', v_referral.id, 'Referral reward')
          returning id into v_wallet_txn_id;

          insert into public.referral_rewards (referral_id, user_id, amount, wallet_transaction_id)
          values (v_referral.id, v_referral.referrer_id, v_reward_amount, v_wallet_txn_id);

          update public.referrals set status = 'completed', completed_at = now() where id = v_referral.id;

          insert into public.notifications (user_id, type, title, body, data)
          values (
            v_referral.referrer_id, 'system', 'Referral reward earned!',
            'Your referral completed their first ride — you earned Rs. ' || v_reward_amount::text || '.',
            jsonb_build_object('referral_id', v_referral.id, 'amount', v_reward_amount)
          );
        end if;
      end if;
    end loop;
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

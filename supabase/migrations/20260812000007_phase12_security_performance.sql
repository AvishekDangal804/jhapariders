-- Phase 12: performance indexes for the query patterns the Phase 11
-- analytics dashboard and admin overview stats actually run. Security
-- findings from the Phase 12 audit are appended below this section once
-- reviewed.

-- Analytics/overview queries filter rides by completed_at/created_at date
-- ranges (getRevenueTrend, getServiceTypeBreakdown, getDailyRideCounts,
-- getAdminOverviewStats) — idx_rides_status alone doesn't help a range scan.
create index if not exists idx_rides_completed_at on public.rides(completed_at);
create index if not exists idx_rides_created_at on public.rides(created_at);

-- getUserGrowth buckets new signups by created_at.
create index if not exists idx_profiles_created_at on public.profiles(created_at);

-- =====================================================================
-- Phase 12 security audit fixes
-- =====================================================================

-- 1. CRITICAL: handle_new_user cast raw_user_meta_data->>'role' straight to
-- the user_role enum, so anyone calling supabase.auth.signUp() directly
-- with { data: { role: 'admin' } } — no session or secret required, just
-- the public anon key — became an admin on signup. Only ever trust
-- 'passenger'/'rider' from client-supplied metadata; anything else
-- (including 'admin') silently falls back to 'passenger'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_requested_role text;
  v_role public.user_role;
begin
  v_requested_role := new.raw_user_meta_data ->> 'role';
  v_role := case when v_requested_role in ('passenger', 'rider') then v_requested_role::public.user_role else 'passenger' end;

  insert into public.profiles (id, role, full_name, email, phone)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  );

  if v_role = 'rider' then
    insert into public.rider_profiles (user_id) values (new.id);
  end if;

  if v_role in ('passenger', 'rider') then
    insert into public.wallets (owner_type, owner_id)
    values (v_role::text::public.wallet_owner_type, new.id);
  end if;

  return new;
end;
$$;

-- 2. CRITICAL: rides_insert_own pinned status/rider_id/final_fare/
-- payment_status/discount_amount, but never bounded estimated_fare or
-- distance_km — a client could INSERT any value directly (bypassing
-- /api/fare entirely), including 0 or negative. Since update_ride_progress
-- copies estimated_fare straight into final_fare with no server-side
-- recomputation, a negative fare flowed into pay_for_ride's wallet math as
-- `balance = balance - final_fare`, which *increases* the passenger's
-- balance while debiting the rider/platform — a real money-minting bug.
-- The full fix (server-computed fare on every ride, not just at /api/fare
-- preview time) needs a trusted create-ride path, which requires an
-- external Mapbox call and so can't live in Postgres alone; as the
-- immediately effective backstop, require a positive fare that's at least
-- the configured minimum for that service type, and a positive distance —
-- this fully closes the negative-fare exploit and the "near-free ride"
-- exploit, at the cost of not verifying the *exact* distance-based amount.
drop policy if exists "rides_insert_own" on public.rides;
create policy "rides_insert_own" on public.rides
  for insert with check (
    passenger_id = auth.uid()
    and status = 'searching'
    and rider_id is null
    and final_fare is null
    and payment_status = 'pending'
    and coalesce(discount_amount, 0) = 0
    and estimated_fare is not null
    and estimated_fare > 0
    and distance_km is not null
    and distance_km > 0
    and estimated_fare >= coalesce(
      (select minimum_fare from public.pricing_settings
       where service_type = rides.service_type and is_active = true
       limit 1),
      0
    )
  );

-- 3. CRITICAL: demo_topup_wallet capped each individual call to <= 5000 but
-- had no lifetime limit, so it could be looped to manufacture unlimited
-- wallet balance, pay for real rides, credit a rider's wallet with
-- real-looking earnings, and cash out via process_withdrawal — an
-- unbounded fraud path even though no real payment gateway is involved.
-- Add a lifetime cap per wallet on top of the existing per-call cap.
create or replace function public.demo_topup_wallet(p_amount numeric)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_wallet record;
  v_lifetime_topups numeric;
begin
  if p_amount <= 0 or p_amount > 5000 then
    raise exception 'Top-up amount must be between 1 and 5000';
  end if;

  select * into v_wallet from public.wallets
    where owner_type = 'passenger' and owner_id = auth.uid() for update;
  if not found then
    raise exception 'Wallet not found';
  end if;

  select coalesce(sum(amount), 0) into v_lifetime_topups
  from public.wallet_transactions
  where wallet_id = v_wallet.id and reference_type = 'demo_topup';

  if v_lifetime_topups + p_amount > 20000 then
    raise exception 'Demo top-up limit reached — this is a demo payment rail for trying out the app, not a real payment gateway';
  end if;

  update public.wallets set balance = balance + p_amount, updated_at = now() where id = v_wallet.id;
  insert into public.wallet_transactions (wallet_id, type, amount, balance_after, reference_type, description)
  values (v_wallet.id, 'credit', p_amount, v_wallet.balance + p_amount, 'demo_topup', 'Demo wallet top-up');
end;
$$;

-- 4. CRITICAL: profiles_update_own_or_admin has no WITH CHECK, so Postgres
-- reuses the USING clause for the new row too — meaning there's no column
-- restriction at all on a user's own UPDATE. `role` was separately guarded
-- by prevent_role_change, but `status` was not: a suspended user could
-- simply call supabase.from('profiles').update({status:'active'}) and
-- immediately reverse their own suspension. Mirror prevent_role_change's
-- pattern for status.
create or replace function public.prevent_status_change()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status and auth.uid() is not null and not public.is_admin() then
    raise exception 'Account status cannot be changed directly';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_status_change on public.profiles;
create trigger profiles_prevent_status_change
  before update on public.profiles
  for each row execute function public.prevent_status_change();

-- 5 & 6. CRITICAL: rider_profiles_update_own_or_admin and
-- vehicles_update_own_or_admin have the same missing-WITH-CHECK problem as
-- #4. The admin verification UI updates rider_profiles.verification_status
-- and vehicles.status with a plain client-side .update() call — any rider
-- could replicate that exact call against their OWN row and self-approve
-- (verification_status: 'approved', status: 'approved'), immediately
-- becoming eligible in accept_ride_request/request_ride_matching's
-- eligibility filters despite never having been reviewed. rating_avg and
-- total_rides are also writable today by any rider directly.
--
-- These columns ARE legitimately written by trusted SECURITY DEFINER RPCs
-- (submit_rating updates rating_avg, update_ride_progress increments
-- total_rides) called BY the non-admin participant — auth.uid() is still
-- the calling user's id inside a SECURITY DEFINER function, so a blanket
-- "block unless is_admin()" trigger would also break those legitimate
-- paths. A transaction-local flag lets those specific RPCs mark their own
-- update as trusted; anything else from a non-admin is blocked.
create or replace function public.prevent_rider_admin_field_change()
returns trigger language plpgsql as $$
begin
  if auth.uid() is not null and not public.is_admin() and coalesce(current_setting('app.trusted_rpc', true), '') <> 'true' then
    if new.verification_status is distinct from old.verification_status
       or new.rating_avg is distinct from old.rating_avg
       or new.total_rides is distinct from old.total_rides then
      raise exception 'Only an admin can change verification status, rating, or ride count';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists rider_profiles_prevent_admin_field_change on public.rider_profiles;
create trigger rider_profiles_prevent_admin_field_change
  before update on public.rider_profiles
  for each row execute function public.prevent_rider_admin_field_change();

create or replace function public.prevent_vehicle_status_change()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status and auth.uid() is not null and not public.is_admin() then
    raise exception 'Only an admin can change vehicle status';
  end if;
  return new;
end;
$$;

drop trigger if exists vehicles_prevent_status_change on public.vehicles;
create trigger vehicles_prevent_status_change
  before update on public.vehicles
  for each row execute function public.prevent_vehicle_status_change();

-- submit_rating and update_ride_progress mark their own writes to the
-- newly-protected rider_profiles columns as trusted. set_config's third
-- argument (true = transaction-local) means this never leaks past the
-- current call.
create or replace function public.submit_rating(
  p_ride_id uuid,
  p_ratee_id uuid,
  p_stars smallint,
  p_review text default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_ride record;
  v_rating_id uuid;
  v_new_avg numeric(3, 2);
begin
  if p_stars < 1 or p_stars > 5 then
    raise exception 'Rating must be between 1 and 5 stars';
  end if;

  select * into v_ride from public.rides where id = p_ride_id;
  if not found then
    raise exception 'Ride not found';
  end if;
  if v_ride.status not in ('ride_completed', 'paid') then
    raise exception 'Ride is not yet completed';
  end if;
  if v_ride.passenger_id <> auth.uid() and v_ride.rider_id <> auth.uid() then
    raise exception 'Not authorized';
  end if;
  if p_ratee_id <> v_ride.passenger_id and p_ratee_id <> v_ride.rider_id then
    raise exception 'Ratee is not a participant of this ride';
  end if;
  if p_ratee_id = auth.uid() then
    raise exception 'Cannot rate yourself';
  end if;

  insert into public.ratings (ride_id, rater_id, ratee_id, stars, review)
  values (p_ride_id, auth.uid(), p_ratee_id, p_stars, p_review)
  returning id into v_rating_id;

  if p_ratee_id = v_ride.rider_id then
    select round(avg(stars)::numeric, 2) into v_new_avg
    from public.ratings where ratee_id = p_ratee_id;

    perform set_config('app.trusted_rpc', 'true', true);
    update public.rider_profiles
    set rating_avg = coalesce(v_new_avg, rating_avg), updated_at = now()
    where user_id = p_ratee_id;
  end if;

  insert into public.notifications (user_id, type, title, body, data)
  values (
    p_ratee_id, 'rating', 'You received a new rating',
    p_stars::text || ' star' || (case when p_stars = 1 then '' else 's' end) ||
      case when p_review is not null and length(trim(p_review)) > 0 then ': ' || p_review else '' end,
    jsonb_build_object('ride_id', p_ride_id, 'rating_id', v_rating_id, 'stars', p_stars)
  );

  return v_rating_id;
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

    perform set_config('app.trusted_rpc', 'true', true);
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
        -- 10. filter by owner_type too, matching the pattern used
        -- elsewhere (pay_for_ride, process_withdrawal) — owner_id alone
        -- happens to be unique today but nothing enforces that.
        select * into v_referrer_wallet from public.wallets
          where owner_type in ('passenger', 'rider') and owner_id = v_referral.referrer_id for update;

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

-- 7. reviews_insert_own_rating constrained the FK to the caller's own
-- rating but never touched is_published/moderated_by/moderated_at — a user
-- could insert a review that's already "published" and attribute
-- moderation to any uuid, bypassing the entire review-moderation model.
-- Dormant today (no app code writes to `reviews` yet) but wrong as
-- written; publishing should only ever happen via a separate admin UPDATE.
drop policy if exists "reviews_insert_own_rating" on public.reviews;
create policy "reviews_insert_own_rating" on public.reviews
  for insert with check (
    is_published = false
    and moderated_by is null
    and moderated_at is null
    and exists (select 1 from public.ratings ra where ra.id = reviews.rating_id and ra.rater_id = auth.uid())
  );

-- 9. withdrawals_insert_own let a rider request withdrawal of any amount
-- regardless of actual wallet balance — the balance check only happened
-- later, at admin approval time in process_withdrawal. Not a funds leak by
-- itself, but it lets anyone flood the admin queue with bogus/oversized
-- requests with no server-side sanity check at request time.
drop policy if exists "withdrawals_insert_own" on public.withdrawals;
create policy "withdrawals_insert_own" on public.withdrawals
  for insert with check (
    rider_id = auth.uid()
    and amount > 0
    and amount <= coalesce(
      (select balance from public.wallets where owner_type = 'rider' and owner_id = auth.uid()),
      0
    )
  );

-- 11. wallets' unique(owner_type, owner_id) doesn't stop two ('platform',
-- NULL) rows from coexisting — Postgres treats NULLs as distinct by
-- default — which would make every `where owner_type = 'platform'` lookup
-- (pay_for_ride, etc.) pick an arbitrary one, silently losing commission.
-- A partial unique index enforces the true invariant: at most one platform
-- wallet, full stop.
create unique index if not exists idx_wallets_platform_singleton
  on public.wallets(owner_type) where owner_type = 'platform';

-- Nice-to-have: bound free-text columns that only had a "not empty" check,
-- to prevent unbounded storage/abuse (not an exploit, just tightening).
-- ADD CONSTRAINT has no IF NOT EXISTS in Postgres, so guard each one the
-- same way rides_coupon_id_fkey does elsewhere in these migrations.
do $$ begin
  alter table public.ratings
    add constraint ratings_review_length check (review is null or length(review) <= 1000);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.support_tickets
    add constraint support_tickets_subject_length check (length(subject) <= 200);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.support_tickets
    add constraint support_tickets_description_length check (length(description) <= 5000);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.support_messages
    add constraint support_messages_message_length check (length(message) <= 5000);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.reports
    add constraint reports_reason_length check (length(reason) <= 500);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.reports
    add constraint reports_description_length check (description is null or length(description) <= 5000);
exception when duplicate_object then null; end $$;

-- =====================================================================
-- JhapaRide — Phase 3 initial schema
-- Run this once in the Supabase SQL Editor (or via `supabase db push`
-- once the CLI is linked). Safe to re-run: guarded with IF NOT EXISTS /
-- OR REPLACE / DROP ... IF EXISTS where practical.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. ENUMS
-- ---------------------------------------------------------------------

do $$ begin
  create type public.user_role as enum ('passenger', 'rider', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.user_status as enum ('active', 'suspended', 'deleted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.verification_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.vehicle_type as enum ('bike', 'car');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.vehicle_status as enum ('pending', 'approved', 'rejected', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.service_type as enum ('bike', 'car', 'parcel');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ride_status as enum (
    'searching', 'driver_assigned', 'driver_arriving', 'driver_arrived',
    'ride_started', 'ride_completed', 'payment_pending', 'paid',
    'cancelled', 'no_driver_found'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum ('cash', 'online', 'wallet');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('pending', 'success', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.wallet_owner_type as enum ('passenger', 'rider', 'platform');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.wallet_transaction_type as enum (
    'credit', 'debit', 'commission', 'refund', 'withdrawal', 'adjustment'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.withdrawal_status as enum (
    'pending', 'approved', 'processing', 'completed', 'rejected'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.support_category as enum (
    'ride_problem', 'payment_problem', 'rider_problem',
    'passenger_problem', 'account_problem', 'safety_issue'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.support_ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_target_type as enum ('rider', 'passenger', 'ride', 'review');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_status as enum ('open', 'investigating', 'resolved', 'dismissed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.cancelled_by_role as enum ('passenger', 'rider', 'admin', 'system');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_type as enum (
    'ride_request', 'ride_accepted', 'rider_arriving', 'rider_arrived',
    'ride_started', 'ride_completed', 'payment_success', 'payment_failed',
    'rating', 'system', 'promotion'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.platform_status as enum ('online', 'maintenance', 'offline');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.coupon_discount_type as enum ('flat', 'percentage');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.emergency_status as enum ('active', 'acknowledged', 'resolved');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ride_request_status as enum ('sent', 'accepted', 'declined', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.referral_status as enum ('pending', 'completed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 2. TABLES
-- ---------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'passenger',
  full_name text not null default '',
  email text not null,
  phone text not null default '',
  avatar_url text,
  address text,
  status public.user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rider_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  verification_status public.verification_status not null default 'pending',
  license_number text,
  license_document_url text,
  emergency_contact_name text,
  emergency_contact_phone text,
  is_online boolean not null default false,
  last_seen timestamptz,
  current_lat double precision,
  current_lng double precision,
  last_location_update timestamptz,
  rating_avg numeric(3, 2) not null default 5.0,
  total_rides integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.rider_profiles(id) on delete cascade,
  type public.vehicle_type not null,
  brand text,
  model text,
  color text,
  registration_number text not null unique,
  registration_document_url text,
  insurance_document_url text,
  status public.vehicle_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rider_documents (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.rider_profiles(id) on delete cascade,
  document_type text not null,
  file_url text not null,
  status public.verification_status not null default 'pending',
  uploaded_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id)
);

create table if not exists public.service_areas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.pricing_settings (
  id uuid primary key default gen_random_uuid(),
  service_type public.service_type not null unique,
  base_fare numeric(10, 2) not null,
  per_km numeric(10, 2) not null,
  per_minute numeric(10, 2) not null,
  minimum_fare numeric(10, 2) not null,
  waiting_charge_per_minute numeric(10, 2) not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

-- Time/area-scoped surge multipliers, layered on top of pricing_settings.
create table if not exists public.fare_rules (
  id uuid primary key default gen_random_uuid(),
  service_area_id uuid references public.service_areas(id) on delete cascade,
  service_type public.service_type,
  surge_multiplier numeric(4, 2) not null default 1,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);

create table if not exists public.system_settings (
  id smallint primary key default 1,
  commission_rate numeric(4, 3) not null default 0.15,
  cancellation_fee numeric(10, 2) not null default 20,
  service_radius_km numeric(5, 2) not null default 5,
  operating_hours_start time not null default '06:00',
  operating_hours_end time not null default '22:00',
  support_contact_email text,
  support_contact_phone text,
  platform_status public.platform_status not null default 'online',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id),
  constraint system_settings_singleton check (id = 1)
);

create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  passenger_id uuid not null references public.profiles(id),
  rider_id uuid references public.profiles(id),
  service_type public.service_type not null,
  pickup_address text not null,
  pickup_lat double precision not null,
  pickup_lng double precision not null,
  destination_address text not null,
  destination_lat double precision not null,
  destination_lng double precision not null,
  distance_km numeric(8, 2),
  estimated_duration_minutes numeric(6, 1),
  estimated_fare numeric(10, 2),
  final_fare numeric(10, 2),
  status public.ride_status not null default 'searching',
  payment_status public.payment_status not null default 'pending',
  payment_method public.payment_method,
  coupon_id uuid,
  discount_amount numeric(10, 2) not null default 0,
  commission_rate numeric(4, 3),
  platform_share numeric(10, 2),
  rider_share numeric(10, 2),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.ride_status_history (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  status public.ride_status not null,
  changed_by uuid references public.profiles(id),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.ride_locations (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  recorded_at timestamptz not null default now()
);

create table if not exists public.ride_requests (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  rider_id uuid not null references public.profiles(id),
  status public.ride_request_status not null default 'sent',
  sent_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (ride_id, rider_id)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null unique references public.rides(id),
  passenger_id uuid not null references public.profiles(id),
  amount numeric(10, 2) not null,
  commission_amount numeric(10, 2) not null default 0,
  rider_amount numeric(10, 2) not null default 0,
  method public.payment_method not null,
  status public.payment_status not null default 'pending',
  transaction_reference text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  owner_type public.wallet_owner_type not null,
  owner_id uuid references public.profiles(id) on delete cascade,
  balance numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_type, owner_id)
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  type public.wallet_transaction_type not null,
  amount numeric(12, 2) not null,
  balance_after numeric(12, 2) not null,
  reference_type text,
  reference_id uuid,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  rater_id uuid not null references public.profiles(id),
  ratee_id uuid not null references public.profiles(id),
  stars smallint not null check (stars between 1 and 5),
  review text,
  created_at timestamptz not null default now(),
  unique (ride_id, rater_id)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  rating_id uuid not null unique references public.ratings(id) on delete cascade,
  is_published boolean not null default false,
  moderated_by uuid references public.profiles(id),
  moderated_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  data jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  category public.support_category not null,
  subject text not null,
  description text not null,
  status public.support_ticket_status not null default 'open',
  ride_id uuid references public.rides(id),
  assigned_to uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  target_type public.report_target_type not null,
  target_id uuid not null,
  reason text not null,
  description text,
  status public.report_status not null default 'open',
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.emergency_events (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id),
  user_id uuid not null references public.profiles(id),
  lat double precision not null,
  lng double precision not null,
  description text,
  status public.emergency_status not null default 'active',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.cancellations (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null unique references public.rides(id),
  cancelled_by_role public.cancelled_by_role not null,
  cancelled_by uuid references public.profiles(id),
  reason text not null,
  fee_charged numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type public.coupon_discount_type not null,
  discount_value numeric(10, 2) not null,
  minimum_fare numeric(10, 2) not null default 0,
  maximum_discount numeric(10, 2),
  usage_limit integer,
  usage_count integer not null default 0,
  expiry_date timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);

do $$ begin
  alter table public.rides
    add constraint rides_coupon_id_fkey foreign key (coupon_id) references public.coupons(id);
exception when duplicate_object then null; end $$;

create table if not exists public.coupon_usage (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  ride_id uuid not null references public.rides(id),
  discount_amount numeric(10, 2) not null,
  used_at timestamptz not null default now(),
  unique (coupon_id, ride_id)
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id),
  code text not null unique,
  referred_user_id uuid unique references public.profiles(id),
  referred_role public.user_role not null,
  status public.referral_status not null default 'pending',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.referrals(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  amount numeric(10, 2) not null,
  wallet_transaction_id uuid references public.wallet_transactions(id),
  created_at timestamptz not null default now()
);

create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.profiles(id),
  amount numeric(10, 2) not null,
  payment_method text not null,
  account_reference text not null,
  status public.withdrawal_status not null default 'pending',
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references public.profiles(id),
  notes text
);

create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id),
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. INDEXES
-- ---------------------------------------------------------------------

create index if not exists idx_rider_profiles_user_id on public.rider_profiles(user_id);
create index if not exists idx_rider_profiles_online on public.rider_profiles(is_online, verification_status);
create index if not exists idx_vehicles_rider_id on public.vehicles(rider_id);
create index if not exists idx_rider_documents_rider_id on public.rider_documents(rider_id);
create index if not exists idx_service_areas_active on public.service_areas(is_active);

create index if not exists idx_rides_passenger_id on public.rides(passenger_id);
create index if not exists idx_rides_rider_id on public.rides(rider_id);
create index if not exists idx_rides_status on public.rides(status);
create index if not exists idx_ride_status_history_ride_id on public.ride_status_history(ride_id);
create index if not exists idx_ride_locations_ride_id on public.ride_locations(ride_id);
create index if not exists idx_ride_requests_ride_id on public.ride_requests(ride_id);
create index if not exists idx_ride_requests_rider_id on public.ride_requests(rider_id);

create index if not exists idx_payments_ride_id on public.payments(ride_id);
create index if not exists idx_wallets_owner on public.wallets(owner_type, owner_id);
create index if not exists idx_wallet_transactions_wallet_id on public.wallet_transactions(wallet_id);

create index if not exists idx_ratings_ratee_id on public.ratings(ratee_id);
create index if not exists idx_reviews_published on public.reviews(is_published);

create index if not exists idx_notifications_user_id on public.notifications(user_id, is_read);
create index if not exists idx_support_tickets_user_id on public.support_tickets(user_id);
create index if not exists idx_support_messages_ticket_id on public.support_messages(ticket_id);
create index if not exists idx_reports_reporter_id on public.reports(reporter_id);
create index if not exists idx_emergency_events_ride_id on public.emergency_events(ride_id);

create index if not exists idx_coupon_usage_user_id on public.coupon_usage(user_id);
create index if not exists idx_referrals_referrer_id on public.referrals(referrer_id);
create index if not exists idx_withdrawals_rider_id on public.withdrawals(rider_id);
create index if not exists idx_admin_logs_admin_id on public.admin_logs(admin_id);

-- ---------------------------------------------------------------------
-- 4. FUNCTIONS & TRIGGERS
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'rider_profiles', 'vehicles', 'rides', 'wallets', 'support_tickets',
    'pricing_settings', 'system_settings'
  ] loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I; create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at();',
      t, t
    );
  end loop;
end $$;

-- Helper used throughout RLS policies. SECURITY DEFINER + a query against
-- profiles bypasses that table's own RLS, avoiding recursive-policy issues.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Creates the profile (+ rider_profile + wallet) row for every new
-- auth.users signup, reading role/full_name/phone from the metadata
-- passed at sign-up time (see RegisterForm).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_role public.user_role;
begin
  v_role := coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'passenger');

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- A user's role is never client-editable, even via a direct profiles
-- update — only an admin action can change it.
create or replace function public.prevent_role_change()
returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Role cannot be changed directly';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_change on public.profiles;
create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- Every ride status change is appended to ride_status_history
-- automatically — the app never writes history rows directly.
create or replace function public.log_ride_status_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into public.ride_status_history (ride_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists rides_log_status_change on public.rides;
create trigger rides_log_status_change
  after update on public.rides
  for each row execute function public.log_ride_status_change();

-- ---------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- Unlike the sections above, the `create policy` statements below are NOT
-- idempotent (re-running this file as-is will fail with "policy already
-- exists"). This migration is meant to run once; if you need to re-apply
-- it, drop the affected policies first (or drop and recreate the tables).
-- ---------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.rider_profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.rider_documents enable row level security;
alter table public.service_areas enable row level security;
alter table public.pricing_settings enable row level security;
alter table public.fare_rules enable row level security;
alter table public.system_settings enable row level security;
alter table public.rides enable row level security;
alter table public.ride_status_history enable row level security;
alter table public.ride_locations enable row level security;
alter table public.ride_requests enable row level security;
alter table public.payments enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.ratings enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.reports enable row level security;
alter table public.emergency_events enable row level security;
alter table public.cancellations enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_usage enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_rewards enable row level security;
alter table public.withdrawals enable row level security;
alter table public.admin_logs enable row level security;

-- profiles: users manage their own row; admins manage all.
-- Direct INSERT is intentionally not granted — rows are created only by
-- the handle_new_user trigger (which runs as SECURITY DEFINER).
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- rider_profiles: rider manages their own row; admin manages all;
-- a passenger may view the rider profile of whoever is on their active ride.
create policy "rider_profiles_select" on public.rider_profiles
  for select using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.rides r
      where r.rider_id = rider_profiles.user_id
        and r.passenger_id = auth.uid()
        and r.status in ('driver_assigned', 'driver_arriving', 'driver_arrived', 'ride_started')
    )
  );
create policy "rider_profiles_update_own_or_admin" on public.rider_profiles
  for update using (user_id = auth.uid() or public.is_admin());

-- vehicles: owning rider + admin.
create policy "vehicles_select" on public.vehicles
  for select using (
    public.is_admin()
    or exists (select 1 from public.rider_profiles rp where rp.id = vehicles.rider_id and rp.user_id = auth.uid())
  );
create policy "vehicles_insert_own" on public.vehicles
  for insert with check (
    exists (select 1 from public.rider_profiles rp where rp.id = vehicles.rider_id and rp.user_id = auth.uid())
  );
create policy "vehicles_update_own_or_admin" on public.vehicles
  for update using (
    public.is_admin()
    or exists (select 1 from public.rider_profiles rp where rp.id = vehicles.rider_id and rp.user_id = auth.uid())
  );

-- rider_documents: private to the owning rider + admin. Never public.
create policy "rider_documents_select_own_or_admin" on public.rider_documents
  for select using (
    public.is_admin()
    or exists (select 1 from public.rider_profiles rp where rp.id = rider_documents.rider_id and rp.user_id = auth.uid())
  );
create policy "rider_documents_insert_own" on public.rider_documents
  for insert with check (
    exists (select 1 from public.rider_profiles rp where rp.id = rider_documents.rider_id and rp.user_id = auth.uid())
  );
create policy "rider_documents_update_admin" on public.rider_documents
  for update using (public.is_admin());

-- Public reference/config data: readable by anyone, editable by admins only.
create policy "service_areas_select_all" on public.service_areas for select using (true);
create policy "service_areas_write_admin" on public.service_areas for insert with check (public.is_admin());
create policy "service_areas_update_admin" on public.service_areas for update using (public.is_admin());
create policy "service_areas_delete_admin" on public.service_areas for delete using (public.is_admin());

create policy "pricing_settings_select_all" on public.pricing_settings for select using (true);
create policy "pricing_settings_write_admin" on public.pricing_settings for insert with check (public.is_admin());
create policy "pricing_settings_update_admin" on public.pricing_settings for update using (public.is_admin());

create policy "fare_rules_select_all" on public.fare_rules for select using (true);
create policy "fare_rules_write_admin" on public.fare_rules for insert with check (public.is_admin());
create policy "fare_rules_update_admin" on public.fare_rules for update using (public.is_admin());
create policy "fare_rules_delete_admin" on public.fare_rules for delete using (public.is_admin());

create policy "system_settings_select_all" on public.system_settings for select using (true);
create policy "system_settings_update_admin" on public.system_settings for update using (public.is_admin());

-- rides: participants + admin can read. Direct client UPDATE is admin-only
-- — passenger/rider-driven transitions (accept, start, complete, cancel)
-- go through SECURITY DEFINER RPCs added in Phase 8, which validate the
-- transition before writing, instead of trusting a raw client UPDATE.
create policy "rides_select_participants_or_admin" on public.rides
  for select using (passenger_id = auth.uid() or rider_id = auth.uid() or public.is_admin());
create policy "rides_insert_own" on public.rides
  for insert with check (passenger_id = auth.uid());
create policy "rides_update_admin" on public.rides
  for update using (public.is_admin());

create policy "ride_status_history_select" on public.ride_status_history
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.rides r
      where r.id = ride_status_history.ride_id
        and (r.passenger_id = auth.uid() or r.rider_id = auth.uid())
    )
  );

create policy "ride_locations_select" on public.ride_locations
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.rides r
      where r.id = ride_locations.ride_id
        and (r.passenger_id = auth.uid() or r.rider_id = auth.uid())
    )
  );
create policy "ride_locations_insert_assigned_rider" on public.ride_locations
  for insert with check (
    exists (
      select 1 from public.rides r
      where r.id = ride_locations.ride_id
        and r.rider_id = auth.uid()
        and r.status in ('driver_assigned', 'driver_arriving', 'driver_arrived', 'ride_started')
    )
  );

create policy "ride_requests_select_own_or_admin" on public.ride_requests
  for select using (
    rider_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.rides r where r.id = ride_requests.ride_id and r.passenger_id = auth.uid())
  );
create policy "ride_requests_write_admin" on public.ride_requests
  for insert with check (public.is_admin());
create policy "ride_requests_update_admin" on public.ride_requests
  for update using (public.is_admin());

-- payments: participants can read; writes are server/admin-only — a fare
-- is never trusted from the client (see lib/fare).
create policy "payments_select_participants_or_admin" on public.payments
  for select using (
    public.is_admin()
    or passenger_id = auth.uid()
    or exists (select 1 from public.rides r where r.id = payments.ride_id and r.rider_id = auth.uid())
  );
create policy "payments_write_admin" on public.payments
  for insert with check (public.is_admin());
create policy "payments_update_admin" on public.payments
  for update using (public.is_admin());

-- wallets & wallet_transactions: strictly owner + admin, read-only for the
-- owner — balances only ever change through server-side ledger writes.
create policy "wallets_select_own_or_admin" on public.wallets
  for select using (owner_id = auth.uid() or public.is_admin());
create policy "wallets_write_admin" on public.wallets
  for insert with check (public.is_admin());
create policy "wallets_update_admin" on public.wallets
  for update using (public.is_admin());

create policy "wallet_transactions_select_own_or_admin" on public.wallet_transactions
  for select using (
    public.is_admin()
    or exists (select 1 from public.wallets w where w.id = wallet_transactions.wallet_id and w.owner_id = auth.uid())
  );
create policy "wallet_transactions_write_admin" on public.wallet_transactions
  for insert with check (public.is_admin());

-- ratings: only ride participants may rate each other, once per ride,
-- and only after the ride is completed.
create policy "ratings_select_participants_or_admin" on public.ratings
  for select using (rater_id = auth.uid() or ratee_id = auth.uid() or public.is_admin());
create policy "ratings_insert_participant" on public.ratings
  for insert with check (
    rater_id = auth.uid()
    and exists (
      select 1 from public.rides r
      where r.id = ratings.ride_id
        and r.status = 'ride_completed'
        and (r.passenger_id = auth.uid() or r.rider_id = auth.uid())
        and (ratee_id = r.passenger_id or ratee_id = r.rider_id)
    )
  );

create policy "reviews_select_published_or_owner_or_admin" on public.reviews
  for select using (
    is_published = true
    or public.is_admin()
    or exists (select 1 from public.ratings ra where ra.id = reviews.rating_id and ra.rater_id = auth.uid())
  );
create policy "reviews_insert_own_rating" on public.reviews
  for insert with check (
    exists (select 1 from public.ratings ra where ra.id = reviews.rating_id and ra.rater_id = auth.uid())
  );
create policy "reviews_update_admin" on public.reviews
  for update using (public.is_admin());

-- notifications: strictly the recipient (read + mark-as-read) + admin.
create policy "notifications_select_own_or_admin" on public.notifications
  for select using (user_id = auth.uid() or public.is_admin());
create policy "notifications_update_own_or_admin" on public.notifications
  for update using (user_id = auth.uid() or public.is_admin());
create policy "notifications_write_admin" on public.notifications
  for insert with check (public.is_admin());

-- support: ticket owner + admin.
create policy "support_tickets_select_own_or_admin" on public.support_tickets
  for select using (user_id = auth.uid() or public.is_admin());
create policy "support_tickets_insert_own" on public.support_tickets
  for insert with check (user_id = auth.uid());
create policy "support_tickets_update_own_or_admin" on public.support_tickets
  for update using (user_id = auth.uid() or public.is_admin());

create policy "support_messages_select" on public.support_messages
  for select using (
    public.is_admin()
    or exists (select 1 from public.support_tickets t where t.id = support_messages.ticket_id and t.user_id = auth.uid())
  );
create policy "support_messages_insert" on public.support_messages
  for insert with check (
    sender_id = auth.uid()
    and (
      public.is_admin()
      or exists (select 1 from public.support_tickets t where t.id = support_messages.ticket_id and t.user_id = auth.uid())
    )
  );

-- reports: reporter + admin.
create policy "reports_select_own_or_admin" on public.reports
  for select using (reporter_id = auth.uid() or public.is_admin());
create policy "reports_insert_own" on public.reports
  for insert with check (reporter_id = auth.uid());
create policy "reports_update_admin" on public.reports
  for update using (public.is_admin());

-- emergency_events: the reporting user + admin. SOS never silently fails.
create policy "emergency_events_select_own_or_admin" on public.emergency_events
  for select using (user_id = auth.uid() or public.is_admin());
create policy "emergency_events_insert_own" on public.emergency_events
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.rides r
      where r.id = emergency_events.ride_id
        and (r.passenger_id = auth.uid() or r.rider_id = auth.uid())
    )
  );
create policy "emergency_events_update_admin" on public.emergency_events
  for update using (public.is_admin());

create policy "cancellations_select_participants_or_admin" on public.cancellations
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.rides r
      where r.id = cancellations.ride_id and (r.passenger_id = auth.uid() or r.rider_id = auth.uid())
    )
  );
create policy "cancellations_write_admin" on public.cancellations
  for insert with check (public.is_admin());

-- coupons: active coupons are publicly readable so passengers can validate
-- a code before applying it; only admins manage them.
create policy "coupons_select_active_or_admin" on public.coupons
  for select using (is_active = true or public.is_admin());
create policy "coupons_write_admin" on public.coupons
  for insert with check (public.is_admin());
create policy "coupons_update_admin" on public.coupons
  for update using (public.is_admin());
create policy "coupons_delete_admin" on public.coupons
  for delete using (public.is_admin());

create policy "coupon_usage_select_own_or_admin" on public.coupon_usage
  for select using (user_id = auth.uid() or public.is_admin());
create policy "coupon_usage_write_admin" on public.coupon_usage
  for insert with check (public.is_admin());

-- referrals: users can generate their own code and see their referrals.
create policy "referrals_select_own_or_admin" on public.referrals
  for select using (referrer_id = auth.uid() or referred_user_id = auth.uid() or public.is_admin());
create policy "referrals_insert_own" on public.referrals
  for insert with check (referrer_id = auth.uid());
create policy "referrals_update_admin" on public.referrals
  for update using (public.is_admin());

create policy "referral_rewards_select_own_or_admin" on public.referral_rewards
  for select using (user_id = auth.uid() or public.is_admin());
create policy "referral_rewards_write_admin" on public.referral_rewards
  for insert with check (public.is_admin());

-- withdrawals: rider requests, admin processes.
create policy "withdrawals_select_own_or_admin" on public.withdrawals
  for select using (rider_id = auth.uid() or public.is_admin());
create policy "withdrawals_insert_own" on public.withdrawals
  for insert with check (rider_id = auth.uid());
create policy "withdrawals_update_admin" on public.withdrawals
  for update using (public.is_admin());

-- admin_logs: admin-only, append-only audit trail.
create policy "admin_logs_select_admin" on public.admin_logs
  for select using (public.is_admin());
create policy "admin_logs_insert_admin" on public.admin_logs
  for insert with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 6. SEED — singleton settings rows + platform wallet
-- ---------------------------------------------------------------------

insert into public.system_settings (id)
values (1)
on conflict (id) do nothing;

insert into public.pricing_settings (service_type, base_fare, per_km, per_minute, minimum_fare, waiting_charge_per_minute)
values
  ('bike', 30, 15, 2, 50, 1),
  ('car', 80, 25, 3, 120, 2)
on conflict (service_type) do nothing;

insert into public.wallets (owner_type, owner_id)
select 'platform', null
where not exists (select 1 from public.wallets where owner_type = 'platform');

-- ---------------------------------------------------------------------
-- 7. STORAGE BUCKETS
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('rider-documents', 'rider-documents', false)
on conflict (id) do nothing;

-- avatars: anyone can view; a user may only write to their own
-- `${auth.uid()}/...` path.
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_write" on storage.objects;
create policy "avatars_owner_write" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- rider-documents: private. Only the uploading rider and admins can read
-- (via signed URLs — see rider-documents section, Phase 5), matching the
-- privacy policy's "documents are never publicly accessible" guarantee.
drop policy if exists "rider_documents_owner_read" on storage.objects;
create policy "rider_documents_owner_read" on storage.objects
  for select using (
    bucket_id = 'rider-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists "rider_documents_owner_write" on storage.objects;
create policy "rider_documents_owner_write" on storage.objects
  for insert with check (bucket_id = 'rider-documents' and (storage.foldername(name))[1] = auth.uid()::text);

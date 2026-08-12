# JhapaRide

**Your Ride. Your Jhapa.**

A full-stack, commercial-grade ride-hailing platform built for Jhapa, Nepal — passenger booking, a rider earnings app, and a complete admin back office, all on one codebase.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Turbopack) |
| Language | TypeScript |
| Styling / UI | Tailwind CSS v4, shadcn/ui (Radix primitives) |
| Database / Auth / Realtime / Storage | Supabase (Postgres, Row Level Security, Realtime, Storage) |
| Maps & routing | Mapbox (Directions + Geocoding), with an offline-friendly demo map fallback when no token is configured |
| Charts | Recharts |
| Testing | Vitest |
| Hosting | Vercel |

## Features

**Passengers** — book bike/car rides with live server-computed fares, track a matched rider in real time, pay by wallet or cash, rate the rider, apply coupon codes, refer friends for rewards, raise support tickets, and trigger an SOS alert mid-ride.

**Riders** — onboard with license/vehicle documents for admin verification, go online/offline, receive and accept nearby ride requests in real time, track earnings, request wallet withdrawals, and rate passengers.

**Admin** — full back office: user/rider/vehicle verification, live ride monitoring, payments and commission tracking, withdrawal approval, coupon and pricing management, service-area and surge configuration, support ticket and SOS triage, an analytics dashboard (revenue trends, service-type mix, growth, top riders), and an audit log of every admin action.

**Platform-wide** — every fare is computed and validated server-side (never trusted from the client); every money-moving operation runs through a `SECURITY DEFINER` Postgres function under a row lock; Row Level Security is enabled on every table with no client ever able to read or write outside its own scope; realtime ride status and notifications are pushed over Supabase Realtime; a wallet ledger (never a raw balance overwrite) backs every credit/debit.

## Project structure

```
src/
  app/            Next.js routes — (marketing) public site, (auth), passenger/, rider/, admin/
  components/     Shared UI, shadcn/ui primitives, and feature components
  lib/            Data-access ("queries.ts" per domain), fare engine, Supabase clients, auth helpers
  config/         Static config: nav items, service areas, site metadata
  types/          Shared domain types, kept in sync with the Postgres schema
  proxy.ts        Middleware — role-based route protection, suspended-account gating
supabase/
  migrations/     Every schema change, in order — see "Database setup" below
scripts/
  seed-demo-data.mjs   Creates demo admin/rider/passenger accounts + a demo coupon
```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=       # optional — omit to run in demo map mode
```

The Supabase values come from your project's **Settings → API** page. The service role key is only ever used server-side (`src/lib/supabase/admin.ts`, marked `server-only`) and by the demo-seed script — never commit it.

### 3. Set up the database

In your Supabase project's **SQL Editor**, run every file in `supabase/migrations/` **in filename order** (they're timestamped, so sorting alphabetically is sorting chronologically). Each migration is idempotent — safe to re-run if you're unsure whether one already applied.

This provisions the full schema, Row Level Security policies, triggers, and every `SECURITY DEFINER` RPC the app calls (ride matching, payments, ratings, coupons, referrals, etc.), plus seed data for pricing, system settings, and Jhapa's service areas.

### 4. (Optional) Seed demo accounts

```bash
npm run seed:demo
```

Creates a pre-approved demo admin, rider (verified, online, with a vehicle), and passenger — see [Demo accounts](#demo-accounts) below. Safe to re-run; skips anything that already exists.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
npm test    # Vitest — fare/commission math, distance calculations
npm run lint
npm run build
```

The core money math (fare estimation, commission splitting, currency formatting) and geo calculations have unit test coverage. Every feature phase was additionally verified with live end-to-end Playwright runs against a real Supabase project during development (multi-browser-context tests simulating separate passenger/rider/admin sessions) — not included in the repo, since they depend on live test accounts, but the coverage was thorough: full ride lifecycle, payments/wallets, notifications/ratings/support/SOS, coupons/referrals/analytics, and a dedicated security-fix verification pass.

## Demo accounts

After running `npm run seed:demo`:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@jhaparide.demo` | `JhapaDemo123!` |
| Rider | `rider@jhaparide.demo` | `JhapaDemo123!` |
| Passenger | `passenger@jhaparide.demo` | `JhapaDemo123!` |

The rider account is pre-approved, online, and has a vehicle on file, so it can accept ride requests immediately. A demo coupon code (`WELCOME100`, Rs. 100 off) is also created for trying the booking flow's coupon step.

## Deployment

The app is a standard Next.js app — deploy to [Vercel](https://vercel.com) by connecting the repo and setting the same environment variables as `.env.local` in the project's dashboard. Run the Supabase migrations against your production project before the first deploy; `npm run seed:demo` is optional in production (skip it, or run it once for a reviewable demo environment).

## Security

Every RPC that moves money or changes trust-sensitive state (verification status, account status, roles) runs as `SECURITY DEFINER` under an explicit ownership/authorization check and a row lock, never trusting a client-supplied amount. Row Level Security is enabled on every table, with `WITH CHECK` clauses or triggers guarding every column a user could otherwise self-escalate through (role, account status, rider verification, vehicle approval). See `supabase/migrations/20260812000007_phase12_security_performance.sql` for the audit trail of what was found and fixed.

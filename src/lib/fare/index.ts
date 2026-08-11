import type { FareBreakdown, ServiceType } from "@/types";

// Centralized fare engine. This is the ONLY place fare math should happen.
//
// These defaults mirror the rows seeded into the `pricing_settings` table
// (Phase 3/7). The UI must never hard-code prices elsewhere — components
// should call `estimateFare()` (client-side, for display only) and the
// `/api/fare` route must recompute the authoritative fare server-side from
// the database before a ride is ever created or paid. Client-submitted
// fares are never trusted.
export interface ServicePricing {
  baseFare: number;
  perKm: number;
  perMinute: number;
  minimumFare: number;
  waitingChargePerMinute: number;
}

export const DEFAULT_PRICING: Record<Exclude<ServiceType, "parcel">, ServicePricing> = {
  bike: {
    baseFare: 30,
    perKm: 15,
    perMinute: 2,
    minimumFare: 50,
    waitingChargePerMinute: 1,
  },
  car: {
    baseFare: 80,
    perKm: 25,
    perMinute: 3,
    minimumFare: 120,
    waitingChargePerMinute: 2,
  },
};

export interface EstimateFareInput {
  serviceType: ServiceType;
  distanceKm: number;
  durationMinutes: number;
  waitingMinutes?: number;
  surgeMultiplier?: number;
  discount?: number;
  pricing?: Partial<Record<Exclude<ServiceType, "parcel">, ServicePricing>>;
}

export function estimateFare({
  serviceType,
  distanceKm,
  durationMinutes,
  waitingMinutes = 0,
  surgeMultiplier = 1,
  discount = 0,
  pricing,
}: EstimateFareInput): FareBreakdown {
  const table = serviceType === "parcel" ? DEFAULT_PRICING.bike : DEFAULT_PRICING[serviceType];
  const rates = pricing?.[serviceType === "parcel" ? "bike" : serviceType] ?? table;

  const baseFare = rates.baseFare;
  const distanceFare = round(rates.perKm * Math.max(distanceKm, 0));
  const timeFare = round(rates.perMinute * Math.max(durationMinutes, 0));
  const waitingCharge = round(rates.waitingChargePerMinute * Math.max(waitingMinutes, 0));

  const rawSubtotal = (baseFare + distanceFare + timeFare + waitingCharge) * surgeMultiplier;
  const subtotal = round(Math.max(rawSubtotal, rates.minimumFare));
  const total = round(Math.max(subtotal - discount, 0));

  return {
    serviceType,
    baseFare,
    distanceFare,
    timeFare,
    waitingCharge,
    surgeMultiplier,
    subtotal,
    discount,
    total,
    currency: "NPR",
  };
}

export interface CommissionSplit {
  fare: number;
  commissionRate: number;
  platformShare: number;
  riderShare: number;
}

export function splitCommission(fare: number, commissionRate: number): CommissionSplit {
  const platformShare = round(fare * commissionRate);
  const riderShare = round(fare - platformShare);
  return { fare, commissionRate, platformShare, riderShare };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatNpr(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-NP", { maximumFractionDigits: 0 })}`;
}

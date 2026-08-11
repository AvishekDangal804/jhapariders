import "server-only";
import { createClient } from "@/lib/supabase/server";
import { estimateFare, type ServicePricing } from "@/lib/fare";
import { getRoute } from "@/lib/maps/directions";
import { haversineKm, estimateDurationMinutes } from "@/lib/geo/haversine";
import type { Address, FareBreakdown, ServiceType } from "@/types";

export interface ServerFareResult {
  fare: FareBreakdown;
  distanceKm: number;
  durationMinutes: number;
  routeSource: "mapbox" | "estimated";
}

// The one authoritative place a fare is computed. Always reads pricing from
// the database (never trusts a client-supplied rate) and — when a Mapbox
// token is configured — uses real driving distance/duration instead of the
// straight-line haversine fallback.
export async function computeServerFare({
  pickup,
  destination,
  serviceType,
}: {
  pickup: Address;
  destination: Address;
  serviceType: Exclude<ServiceType, "parcel">;
}): Promise<ServerFareResult> {
  const supabase = await createClient();

  const [{ data: pricingRow }, { data: settingsRow }, route] = await Promise.all([
    supabase
      .from("pricing_settings")
      .select("base_fare, per_km, per_minute, minimum_fare, waiting_charge_per_minute")
      .eq("service_type", serviceType)
      .eq("is_active", true)
      .maybeSingle<{
        base_fare: number;
        per_km: number;
        per_minute: number;
        minimum_fare: number;
        waiting_charge_per_minute: number;
      }>(),
    supabase.from("system_settings").select("commission_rate").eq("id", 1).maybeSingle<{
      commission_rate: number;
    }>(),
    getRoute(pickup, destination),
  ]);

  if (!pricingRow) {
    throw new Error(`No active pricing configured for service type "${serviceType}"`);
  }

  const pricing: ServicePricing = {
    baseFare: pricingRow.base_fare,
    perKm: pricingRow.per_km,
    perMinute: pricingRow.per_minute,
    minimumFare: pricingRow.minimum_fare,
    waitingChargePerMinute: pricingRow.waiting_charge_per_minute,
  };

  const distanceKm = route?.distanceKm ?? haversineKm(pickup, destination);
  const durationMinutes = route?.durationMinutes ?? estimateDurationMinutes(distanceKm, serviceType);

  const surgeMultiplier = await getActiveSurgeMultiplier(serviceType);

  const fare = estimateFare({
    serviceType,
    distanceKm,
    durationMinutes,
    surgeMultiplier,
    pricing: { [serviceType]: pricing } as Record<Exclude<ServiceType, "parcel">, ServicePricing>,
  });

  void settingsRow; // commission is applied at payment time (Phase 9), not shown to passengers here

  return {
    fare,
    distanceKm,
    durationMinutes,
    routeSource: route ? "mapbox" : "estimated",
  };
}

async function getActiveSurgeMultiplier(serviceType: ServiceType): Promise<number> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data } = await supabase
    .from("fare_rules")
    .select("surge_multiplier, service_type, starts_at, ends_at")
    .eq("is_active", true)
    .returns<
      { surge_multiplier: number; service_type: ServiceType | null; starts_at: string | null; ends_at: string | null }[]
    >();

  const applicable = (data ?? []).filter((rule) => {
    if (rule.service_type && rule.service_type !== serviceType) return false;
    if (rule.starts_at && rule.starts_at > nowIso) return false;
    if (rule.ends_at && rule.ends_at < nowIso) return false;
    return true;
  });

  if (applicable.length === 0) return 1;
  return Math.max(...applicable.map((r) => r.surge_multiplier));
}

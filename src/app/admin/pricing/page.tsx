import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { createClient } from "@/lib/supabase/server";
import { PricingForm, type PricingRow } from "./pricing-form";
import type { ServiceType } from "@/types";

export const metadata: Metadata = { title: "Pricing" };

interface DbRow {
  id: string;
  service_type: Exclude<ServiceType, "parcel">;
  base_fare: number;
  per_km: number;
  per_minute: number;
  minimum_fare: number;
  waiting_charge_per_minute: number;
}

export default async function AdminPricingPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pricing_settings")
    .select("id, service_type, base_fare, per_km, per_minute, minimum_fare, waiting_charge_per_minute")
    .order("service_type")
    .returns<DbRow[]>();

  const rows: PricingRow[] = (data ?? []).map((r) => ({
    id: r.id,
    serviceType: r.service_type,
    baseFare: r.base_fare,
    perKm: r.per_km,
    perMinute: r.per_minute,
    minimumFare: r.minimum_fare,
    waitingChargePerMinute: r.waiting_charge_per_minute,
  }));

  return (
    <Container className="max-w-3xl py-6 sm:py-8">
      <h1 className="text-xl font-bold sm:text-2xl">Pricing</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Changes apply to new fare estimates immediately. Rides already in progress keep their
        original estimate.
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {rows.map((row) => (
          <PricingForm key={row.id} row={row} />
        ))}
      </div>
    </Container>
  );
}

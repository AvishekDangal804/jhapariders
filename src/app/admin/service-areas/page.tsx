import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { createClient } from "@/lib/supabase/server";
import { ServiceAreasManager, type ServiceAreaRow } from "./service-areas-manager";

export const metadata: Metadata = { title: "Service Areas" };

export default async function AdminServiceAreasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_areas")
    .select("id, slug, name, lat, lng, is_active")
    .order("name")
    .returns<{ id: string; slug: string; name: string; lat: number; lng: number; is_active: boolean }[]>();

  const areas: ServiceAreaRow[] = (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    lat: row.lat,
    lng: row.lng,
    isActive: row.is_active,
  }));

  return (
    <Container className="max-w-3xl py-6 sm:py-8">
      <h1 className="text-xl font-bold sm:text-2xl">Service Areas</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Control which Jhapa towns are available for booking. Inactive areas are hidden from the
        booking flow.
      </p>
      <div className="mt-6">
        <ServiceAreasManager areas={areas} />
      </div>
    </Container>
  );
}

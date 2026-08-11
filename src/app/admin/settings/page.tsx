import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm, type SystemSettingsData } from "./settings-form";
import type { PlatformStatus } from "@/types";

export const metadata: Metadata = { title: "Settings" };

interface DbRow {
  commission_rate: number;
  cancellation_fee: number;
  service_radius_km: number;
  operating_hours_start: string;
  operating_hours_end: string;
  support_contact_email: string | null;
  support_contact_phone: string | null;
  platform_status: PlatformStatus;
}

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("system_settings")
    .select(
      "commission_rate, cancellation_fee, service_radius_km, operating_hours_start, operating_hours_end, support_contact_email, support_contact_phone, platform_status"
    )
    .eq("id", 1)
    .single<DbRow>();

  const initial: SystemSettingsData = {
    commissionRate: data?.commission_rate ?? 0.15,
    cancellationFee: data?.cancellation_fee ?? 20,
    serviceRadiusKm: data?.service_radius_km ?? 5,
    operatingHoursStart: data?.operating_hours_start?.slice(0, 5) ?? "06:00",
    operatingHoursEnd: data?.operating_hours_end?.slice(0, 5) ?? "22:00",
    supportContactEmail: data?.support_contact_email ?? "",
    supportContactPhone: data?.support_contact_phone ?? "",
    platformStatus: data?.platform_status ?? "online",
  };

  return (
    <Container className="max-w-2xl py-6 sm:py-8">
      <h1 className="text-xl font-bold sm:text-2xl">System Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Platform-wide configuration. Setting status to Maintenance shows the maintenance page to
        visitors once wired up in a future phase.
      </p>
      <div className="mt-6">
        <SettingsForm initial={initial} />
      </div>
    </Container>
  );
}

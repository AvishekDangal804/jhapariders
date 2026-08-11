"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, Car, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { logAdminAction } from "@/lib/admin/log-action";
import type { ServiceType } from "@/types";

export interface PricingRow {
  id: string;
  serviceType: Exclude<ServiceType, "parcel">;
  baseFare: number;
  perKm: number;
  perMinute: number;
  minimumFare: number;
  waitingChargePerMinute: number;
}

const ICON = { bike: Bike, car: Car };

export function PricingForm({ row }: { row: PricingRow }) {
  const router = useRouter();
  const [form, setForm] = useState(row);
  const [saving, setSaving] = useState(false);
  const Icon = ICON[row.serviceType];

  function update(key: keyof PricingRow, value: string) {
    setForm((prev) => ({ ...prev, [key]: Number(value) }));
  }

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("pricing_settings")
      .update({
        base_fare: form.baseFare,
        per_km: form.perKm,
        per_minute: form.perMinute,
        minimum_fare: form.minimumFare,
        waiting_charge_per_minute: form.waitingChargePerMinute,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    setSaving(false);

    if (error) {
      toast.error("Couldn't save pricing.");
      return;
    }
    await logAdminAction(`Updated ${row.serviceType} pricing`, "pricing_settings", row.id, { ...form });
    toast.success("Pricing updated");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base capitalize">
          <Icon className="size-4.5" />
          {row.serviceType}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Base fare (Rs.)" value={form.baseFare} onChange={(v) => update("baseFare", v)} />
          <Field label="Per km (Rs.)" value={form.perKm} onChange={(v) => update("perKm", v)} />
          <Field label="Per minute (Rs.)" value={form.perMinute} onChange={(v) => update("perMinute", v)} />
          <Field label="Minimum fare (Rs.)" value={form.minimumFare} onChange={(v) => update("minimumFare", v)} />
          <Field
            label="Waiting charge / min (Rs.)"
            value={form.waitingChargePerMinute}
            onChange={(v) => update("waitingChargePerMinute", v)}
          />
        </div>
        <Button onClick={save} disabled={saving} className="w-full">
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          Save
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        min={0}
        step="0.5"
        className="mt-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

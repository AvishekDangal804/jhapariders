"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { logAdminAction } from "@/lib/admin/log-action";
import type { PlatformStatus } from "@/types";

export interface SystemSettingsData {
  commissionRate: number;
  cancellationFee: number;
  serviceRadiusKm: number;
  operatingHoursStart: string;
  operatingHoursEnd: string;
  supportContactEmail: string;
  supportContactPhone: string;
  platformStatus: PlatformStatus;
}

export function SettingsForm({ initial }: { initial: SystemSettingsData }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof SystemSettingsData>(key: K, value: SystemSettingsData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("system_settings")
      .update({
        commission_rate: form.commissionRate,
        cancellation_fee: form.cancellationFee,
        service_radius_km: form.serviceRadiusKm,
        operating_hours_start: form.operatingHoursStart,
        operating_hours_end: form.operatingHoursEnd,
        support_contact_email: form.supportContactEmail,
        support_contact_phone: form.supportContactPhone,
        platform_status: form.platformStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    setSaving(false);

    if (error) {
      toast.error("Couldn't save settings.");
      return;
    }
    await logAdminAction("Updated system settings", "system_settings", "1", { ...form });
    toast.success("Settings saved");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Commission rate (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            step="0.5"
            className="mt-1.5"
            value={form.commissionRate * 100}
            onChange={(e) => update("commissionRate", Number(e.target.value) / 100)}
          />
        </div>
        <div>
          <Label>Cancellation fee (Rs.)</Label>
          <Input
            type="number"
            min={0}
            className="mt-1.5"
            value={form.cancellationFee}
            onChange={(e) => update("cancellationFee", Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Service radius (km)</Label>
          <Input
            type="number"
            min={0}
            step="0.5"
            className="mt-1.5"
            value={form.serviceRadiusKm}
            onChange={(e) => update("serviceRadiusKm", Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Platform status</Label>
          <Select value={form.platformStatus} onValueChange={(v) => update("platformStatus", v as PlatformStatus)}>
            <SelectTrigger className="mt-1.5 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Operating hours start</Label>
          <Input
            type="time"
            className="mt-1.5"
            value={form.operatingHoursStart}
            onChange={(e) => update("operatingHoursStart", e.target.value)}
          />
        </div>
        <div>
          <Label>Operating hours end</Label>
          <Input
            type="time"
            className="mt-1.5"
            value={form.operatingHoursEnd}
            onChange={(e) => update("operatingHoursEnd", e.target.value)}
          />
        </div>
        <div>
          <Label>Support email</Label>
          <Input
            type="email"
            className="mt-1.5"
            value={form.supportContactEmail}
            onChange={(e) => update("supportContactEmail", e.target.value)}
          />
        </div>
        <div>
          <Label>Support phone</Label>
          <Input
            className="mt-1.5"
            value={form.supportContactPhone}
            onChange={(e) => update("supportContactPhone", e.target.value)}
          />
        </div>
      </div>
      <Button onClick={save} disabled={saving}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : null}
        Save Settings
      </Button>
    </div>
  );
}

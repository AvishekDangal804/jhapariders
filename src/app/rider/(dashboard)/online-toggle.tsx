"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function OnlineToggle({
  riderProfileId,
  initialOnline,
  canGoOnline,
}: {
  riderProfileId: string;
  initialOnline: boolean;
  canGoOnline: boolean;
}) {
  const [online, setOnline] = useState(initialOnline);
  const [pending, setPending] = useState(false);

  async function handleChange(checked: boolean) {
    if (!canGoOnline) {
      toast.error("You can go online once your account is verified.");
      return;
    }

    setPending(true);
    const supabase = createClient();

    if (checked && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await supabase
            .from("rider_profiles")
            .update({
              is_online: true,
              current_lat: pos.coords.latitude,
              current_lng: pos.coords.longitude,
              last_seen: new Date().toISOString(),
              last_location_update: new Date().toISOString(),
            })
            .eq("id", riderProfileId);
          setOnline(true);
          setPending(false);
          toast.success("You're online");
        },
        async () => {
          await supabase
            .from("rider_profiles")
            .update({ is_online: true, last_seen: new Date().toISOString() })
            .eq("id", riderProfileId);
          setOnline(true);
          setPending(false);
        }
      );
    } else {
      await supabase
        .from("rider_profiles")
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq("id", riderProfileId);
      setOnline(false);
      setPending(false);
      if (!checked) toast.info("You're offline");
    }
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-2xl border p-5",
        online ? "border-primary/30 bg-primary/5" : "bg-card"
      )}
    >
      <div>
        <p className="text-sm font-semibold">{online ? "You're Online" : "You're Offline"}</p>
        <p className="text-xs text-muted-foreground">
          {canGoOnline
            ? online
              ? "Ready to receive ride requests"
              : "Go online to start receiving ride requests"
            : "Available once your documents are verified"}
        </p>
      </div>
      <Switch checked={online} onCheckedChange={handleChange} disabled={pending || !canGoOnline} />
    </div>
  );
}

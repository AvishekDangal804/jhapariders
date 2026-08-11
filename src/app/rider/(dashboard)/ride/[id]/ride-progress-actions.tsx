"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { RideStatus } from "@/types";

const NEXT_STATUS: Partial<Record<RideStatus, { label: string; next: RideStatus }>> = {
  driver_assigned: { label: "I'm on my way", next: "driver_arriving" },
  driver_arriving: { label: "I've arrived", next: "driver_arrived" },
  driver_arrived: { label: "Start Ride", next: "ride_started" },
  ride_started: { label: "Complete Ride", next: "ride_completed" },
};

export function RideProgressActions({ rideId, status }: { rideId: string; status: RideStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const step = NEXT_STATUS[status];

  if (!step) return null;

  async function advance() {
    if (!step) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("update_ride_progress", {
      p_ride_id: rideId,
      p_status: step.next,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message || "Couldn't update ride status.");
      return;
    }
    toast.success(step.label);
    router.refresh();
  }

  return (
    <Button className="w-full" size="lg" onClick={advance} disabled={loading}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {step.label}
    </Button>
  );
}

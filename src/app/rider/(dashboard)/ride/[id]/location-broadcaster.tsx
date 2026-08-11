"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RideStatus } from "@/types";

const ACTIVE_STATUSES: RideStatus[] = [
  "driver_assigned",
  "driver_arriving",
  "driver_arrived",
  "ride_started",
];
const PING_INTERVAL_MS = 15_000;

// Invisible component: while this ride is active, periodically pushes the
// rider's real device location into ride_locations (which the passenger's
// map can subscribe to) and mirrors it onto rider_profiles.current_lat/lng.
// Throttled to once per interval rather than on every geolocation event.
export function LocationBroadcaster({ rideId, status }: { rideId: string; status: RideStatus }) {
  const isActive = ACTIVE_STATUSES.includes(status);

  useEffect(() => {
    if (!isActive || !navigator.geolocation) return;

    const supabase = createClient();

    const ping = () => {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const nowIso = new Date().toISOString();

        await supabase.from("ride_locations").insert({ ride_id: rideId, lat, lng });

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("rider_profiles")
            .update({ current_lat: lat, current_lng: lng, last_location_update: nowIso, last_seen: nowIso })
            .eq("user_id", user.id);
        }
      });
    };

    ping();
    const interval = setInterval(ping, PING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [rideId, isActive]);

  return null;
}

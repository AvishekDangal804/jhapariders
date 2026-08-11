"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ensureRealtimeAuth } from "@/lib/supabase/ensure-realtime-auth";

// Invisible component: subscribes to Postgres changes for one ride (status,
// rider assignment) and its location pings, and refreshes the server
// component tree when anything changes. Refreshing via the RSC re-fetch
// (rather than duplicating the joined ride query client-side) keeps the
// rider/passenger name joins in one place.
export function RealtimeRideWatcher({ rideId }: { rideId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let debounce: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const refresh = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => router.refresh(), 400);
    };

    let channel: ReturnType<typeof supabase.channel> | null = null;

    ensureRealtimeAuth(supabase).then(() => {
      if (cancelled) return;
      channel = supabase
        .channel(`ride-${rideId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${rideId}` },
          refresh
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "ride_locations", filter: `ride_id=eq.${rideId}` },
          refresh
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (debounce) clearTimeout(debounce);
      if (channel) supabase.removeChannel(channel);
    };
  }, [rideId, router]);

  return null;
}
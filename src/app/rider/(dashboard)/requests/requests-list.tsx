"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { formatNpr } from "@/lib/fare";
import { createClient } from "@/lib/supabase/client";
import { ensureRealtimeAuth } from "@/lib/supabase/ensure-realtime-auth";

export interface PendingRequestRow {
  id: string;
  rideId: string;
  sentAt: string;
  pickupAddress: string;
  destinationAddress: string;
  estimatedFare: number | null;
  serviceType: string;
}

export function RequestsList({
  initial,
  riderId,
  isOnline,
}: {
  initial: PendingRequestRow[];
  riderId: string;
  isOnline: boolean;
}) {
  const router = useRouter();
  // `initial` already reflects the latest server data (refreshed via the
  // realtime subscription below); we only need to track which rows this
  // client has locally responded to, to hide them optimistically before
  // the next refresh lands, rather than mirroring `initial` into state.
  const [respondedIds, setRespondedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const requests = initial.filter((r) => !respondedIds.has(r.id));

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    ensureRealtimeAuth(supabase).then(() => {
      if (cancelled) return;
      channel = supabase
        .channel(`rider-requests-${riderId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "ride_requests", filter: `rider_id=eq.${riderId}` },
          () => router.refresh()
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [riderId, router]);

  async function respond(request: PendingRequestRow, accept: boolean) {
    setPendingId(request.id);
    const supabase = createClient();
    const { error } = await supabase.rpc(accept ? "accept_ride_request" : "decline_ride_request", {
      p_ride_id: request.rideId,
    });
    setPendingId(null);

    if (error) {
      toast.error(error.message || "This ride is no longer available.");
      router.refresh();
      return;
    }

    setRespondedIds((prev) => new Set(prev).add(request.id));
    if (accept) {
      toast.success("Ride accepted!");
      router.push(`/rider/ride/${request.rideId}`);
    } else {
      toast.success("Ride declined");
    }
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={BellRing}
        title="No incoming requests"
        description={
          isOnline
            ? "You're online — new ride requests near you will show up here."
            : "Go online from your dashboard to start receiving ride requests."
        }
        className="mt-4"
      />
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {requests.map((r) => (
        <div key={r.id} className="rounded-2xl border bg-card p-4 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">{r.pickupAddress}</p>
              <p className="text-muted-foreground">to {r.destinationAddress}</p>
            </div>
            {r.estimatedFare != null ? (
              <span className="shrink-0 font-semibold">{formatNpr(r.estimatedFare)}</span>
            ) : null}
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              className="flex-1"
              size="sm"
              disabled={pendingId === r.id}
              onClick={() => respond(r, true)}
            >
              {pendingId === r.id ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Accept
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              size="sm"
              disabled={pendingId === r.id}
              onClick={() => respond(r, false)}
            >
              Decline
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

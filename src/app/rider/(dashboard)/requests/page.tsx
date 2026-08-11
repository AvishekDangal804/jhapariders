import type { Metadata } from "next";
import { BellRing } from "lucide-react";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/empty-state";
import { requireRiderState } from "@/lib/supabase/require-rider";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Ride Requests" };

interface PendingRequest {
  id: string;
  sent_at: string;
  ride: {
    pickup_address: string;
    destination_address: string;
    estimated_fare: number | null;
    service_type: string;
  } | null;
}

export default async function RiderRequestsPage() {
  const state = await requireRiderState();
  const supabase = await createClient();

  const { data } = await supabase
    .from("ride_requests")
    .select(
      "id, sent_at, ride:rides(pickup_address, destination_address, estimated_fare, service_type)"
    )
    .eq("rider_id", state.user.id)
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .returns<PendingRequest[]>();

  const requests = data ?? [];

  return (
    <Container className="max-w-lg py-6 sm:py-8">
      <h1 className="text-lg font-semibold">Ride Requests</h1>

      {requests.length === 0 ? (
        <EmptyState
          icon={BellRing}
          title="No incoming requests"
          description={
            state.isOnline
              ? "You're online — new ride requests near you will show up here."
              : "Go online from your dashboard to start receiving ride requests."
          }
          className="mt-4"
        />
      ) : (
        <div className="mt-4 space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl border bg-card p-4 text-sm">
              <p className="font-medium">{r.ride?.pickup_address}</p>
              <p className="text-muted-foreground">to {r.ride?.destination_address}</p>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}

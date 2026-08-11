import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { requireRiderState } from "@/lib/supabase/require-rider";
import { createClient } from "@/lib/supabase/server";
import { RequestsList, type PendingRequestRow } from "./requests-list";

export const metadata: Metadata = { title: "Ride Requests" };

interface DbRow {
  id: string;
  ride_id: string;
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
      "id, ride_id, sent_at, ride:rides(pickup_address, destination_address, estimated_fare, service_type)"
    )
    .eq("rider_id", state.user.id)
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .returns<DbRow[]>();

  const requests: PendingRequestRow[] = (data ?? [])
    .filter((r) => r.ride)
    .map((r) => ({
      id: r.id,
      rideId: r.ride_id,
      sentAt: r.sent_at,
      pickupAddress: r.ride!.pickup_address,
      destinationAddress: r.ride!.destination_address,
      estimatedFare: r.ride!.estimated_fare,
      serviceType: r.ride!.service_type,
    }));

  return (
    <Container className="max-w-lg py-6 sm:py-8">
      <h1 className="text-lg font-semibold">Ride Requests</h1>
      <RequestsList initial={requests} riderId={state.user.id} isOnline={state.isOnline} />
    </Container>
  );
}

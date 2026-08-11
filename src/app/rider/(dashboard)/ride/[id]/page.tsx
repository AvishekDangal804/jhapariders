import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navigation, MapPin as MapPinIcon } from "lucide-react";
import { Container } from "@/components/shared/container";
import { MapView } from "@/components/shared/map-view";
import { RideStatusBadge } from "@/components/rides/ride-status-badge";
import { CancelRideButton } from "@/components/rides/cancel-ride-button";
import { RealtimeRideWatcher } from "@/components/rides/realtime-ride-watcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { formatNpr } from "@/lib/fare";
import { requireRiderState } from "@/lib/supabase/require-rider";
import { getRideById } from "@/lib/rides/queries";
import { RideProgressActions } from "./ride-progress-actions";
import { LocationBroadcaster } from "./location-broadcaster";

export const metadata: Metadata = { title: "Ride Details" };

const CANCELLABLE = ["searching", "driver_assigned", "driver_arriving", "driver_arrived"];

export default async function RiderRideDetailPage({ params }: PageProps<"/rider/ride/[id]">) {
  const { id } = await params;
  const state = await requireRiderState();
  const ride = await getRideById(id);

  if (!ride || ride.riderId !== state.user.id) notFound();

  const fare = ride.finalFare ?? ride.estimatedFare;
  const canCancel = CANCELLABLE.includes(ride.status);

  return (
    <Container className="max-w-lg py-6 sm:py-8">
      <RealtimeRideWatcher rideId={ride.id} />
      <LocationBroadcaster rideId={ride.id} status={ride.status} />

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Ride Details</h1>
        <RideStatusBadge status={ride.status} />
      </div>

      <MapView
        className="mt-4"
        markers={[
          { id: "pickup", label: "Pickup", lat: ride.pickupLat, lng: ride.pickupLng },
          {
            id: "destination",
            label: "Destination",
            lat: ride.destinationLat,
            lng: ride.destinationLng,
            variant: "muted",
          },
        ]}
      />

      {ride.passengerName ? (
        <Card className="mt-4">
          <CardContent className="flex items-center gap-3 py-4">
            <Avatar className="size-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {ride.passengerName
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{ride.passengerName}</p>
              <p className="text-xs text-muted-foreground">Passenger</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-4">
        <CardContent className="space-y-3 py-4 text-sm">
          <div className="flex items-start gap-2.5">
            <Navigation className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Pickup</p>
              <p className="font-medium">{ride.pickupAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <MapPinIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div>
              <p className="text-xs text-muted-foreground">Destination</p>
              <p className="font-medium">{ride.destinationAddress}</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-muted-foreground">
              {ride.serviceType === "bike" ? "Bike" : ride.serviceType === "car" ? "Car" : "Parcel"}
              {ride.distanceKm ? ` · ~${ride.distanceKm.toFixed(1)} km` : ""}
            </span>
            {fare != null ? <span className="font-semibold">{formatNpr(fare)}</span> : null}
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 space-y-3">
        <RideProgressActions rideId={ride.id} status={ride.status} />
        {canCancel ? <CancelRideButton rideId={ride.id} /> : null}
      </div>
    </Container>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Loader2, Navigation, MapPin as MapPinIcon, Star } from "lucide-react";
import { Container } from "@/components/shared/container";
import { MapView } from "@/components/shared/map-view";
import { RideStatusBadge } from "@/components/rides/ride-status-badge";
import { CancelRideButton } from "@/components/rides/cancel-ride-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { formatNpr } from "@/lib/fare";
import { requireProfile } from "@/lib/supabase/require-profile";
import { getRideById } from "@/lib/rides/queries";

export const metadata: Metadata = { title: "Your Ride" };

const CANCELLABLE = ["searching", "driver_assigned", "driver_arriving", "driver_arrived"];

export default async function RideDetailPage({ params }: PageProps<"/passenger/ride/[id]">) {
  const { id } = await params;
  const user = await requireProfile("passenger");
  const ride = await getRideById(id);

  if (!ride || ride.passengerId !== user.id) notFound();

  const fare = ride.finalFare ?? ride.estimatedFare;
  const canCancel = CANCELLABLE.includes(ride.status);

  return (
    <Container className="max-w-lg py-6 sm:py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Your Ride</h1>
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

      {ride.status === "searching" ? (
        <Card className="mt-4 border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-4">
            <Loader2 className="size-5 shrink-0 animate-spin text-primary" />
            <div>
              <p className="text-sm font-semibold">Searching for a nearby rider&hellip;</p>
              <p className="text-xs text-muted-foreground">We&apos;ll notify you as soon as a rider accepts.</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {ride.riderId && ride.riderName ? (
        <Card className="mt-4">
          <CardContent className="flex items-center gap-3 py-4">
            <Avatar className="size-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {ride.riderName
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{ride.riderName}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="size-3 fill-amber-400 text-amber-400" />
                Your rider
              </p>
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

      {canCancel ? (
        <div className="mt-4">
          <CancelRideButton rideId={ride.id} />
        </div>
      ) : null}
    </Container>
  );
}

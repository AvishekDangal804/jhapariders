import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock3, Navigation, MapPin as MapPinIcon, Star } from "lucide-react";
import { Container } from "@/components/shared/container";
import { MapView } from "@/components/shared/map-view";
import { RatingForm } from "@/components/ratings/rating-form";
import { RideStatusBadge } from "@/components/rides/ride-status-badge";
import { CancelRideButton } from "@/components/rides/cancel-ride-button";
import { RealtimeRideWatcher } from "@/components/rides/realtime-ride-watcher";
import { SosButton } from "@/components/rides/sos-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { formatNpr } from "@/lib/fare";
import { getMyRatingForRide } from "@/lib/ratings/queries";
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
  const inProgress = ["driver_assigned", "driver_arriving", "driver_arrived", "ride_started"].includes(ride.status);
  const myRating = ride.status === "paid" ? await getMyRatingForRide(ride.id, state.user.id) : null;

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

      {ride.status === "ride_completed" ? (
        <Card className="mt-4 border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-4">
            <Clock3 className="size-5 shrink-0 text-primary" />
            <p className="text-sm font-semibold">Waiting for the passenger to complete payment&hellip;</p>
          </CardContent>
        </Card>
      ) : ride.status === "paid" ? (
        <>
          <Card className="mt-4 border-primary/30 bg-primary/5">
            <CardContent className="flex items-center gap-3 py-4">
              <CheckCircle2 className="size-5 shrink-0 text-primary" />
              <p className="text-sm font-semibold">
                Payment received{ride.riderShare != null ? ` — you earned ${formatNpr(ride.riderShare)}` : ""}.
              </p>
            </CardContent>
          </Card>
          {ride.passengerName ? (
            myRating ? (
              <Card className="mt-4">
                <CardContent className="flex items-center gap-2 py-4 text-sm">
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                  <span>
                    You rated {ride.passengerName} {myRating.stars} star{myRating.stars === 1 ? "" : "s"}
                    {myRating.review ? `: “${myRating.review}”` : ""}
                  </span>
                </CardContent>
              </Card>
            ) : (
              <RatingForm
                rideId={ride.id}
                rateeId={ride.passengerId}
                rateeName={ride.passengerName}
                rateeLabel="passenger"
              />
            )
          ) : null}
        </>
      ) : null}

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
        {inProgress ? <SosButton rideId={ride.id} fallbackLat={ride.pickupLat} fallbackLng={ride.pickupLng} /> : null}
        {canCancel ? <CancelRideButton rideId={ride.id} /> : null}
      </div>
    </Container>
  );
}

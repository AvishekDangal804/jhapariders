"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Bike, Car, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LocationPicker } from "@/components/shared/location-picker";
import { FareCard } from "@/components/rides/fare-card";
import { createClient } from "@/lib/supabase/client";
import { estimateFare } from "@/lib/fare";
import { haversineKm, estimateDurationMinutes } from "@/lib/geo/haversine";
import { cn } from "@/lib/utils";
import type { Address, ServiceType } from "@/types";

const STEPS = ["pickup", "destination", "service", "review"] as const;
type Step = (typeof STEPS)[number];

const services: { value: Exclude<ServiceType, "parcel">; label: string; icon: typeof Bike }[] = [
  { value: "bike", label: "Bike", icon: Bike },
  { value: "car", label: "Car", icon: Car },
];

export function BookingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialService = searchParams.get("service") === "car" ? "car" : "bike";

  const [stepIndex, setStepIndex] = useState(0);
  const [pickup, setPickup] = useState<Address | null>(null);
  const [destination, setDestination] = useState<Address | null>(null);
  const [serviceType, setServiceType] = useState<Exclude<ServiceType, "parcel">>(initialService);
  const [submitting, setSubmitting] = useState(false);

  const step: Step = STEPS[stepIndex];

  const distanceKm = useMemo(() => {
    if (!pickup || !destination) return 0;
    return haversineKm(pickup, destination);
  }, [pickup, destination]);

  const durationMinutes = useMemo(
    () => (distanceKm > 0 ? estimateDurationMinutes(distanceKm, serviceType) : 0),
    [distanceKm, serviceType]
  );

  const fare = useMemo(
    () =>
      distanceKm > 0
        ? estimateFare({ serviceType, distanceKm, durationMinutes })
        : null,
    [serviceType, distanceKm, durationMinutes]
  );

  function canContinue() {
    if (step === "pickup") return !!pickup;
    if (step === "destination") return !!destination;
    return true;
  }

  function goNext() {
    if (stepIndex < STEPS.length - 1) setStepIndex(stepIndex + 1);
  }
  function goBack() {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  }

  async function confirmRide() {
    if (!pickup || !destination || !fare) return;
    setSubmitting(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please log in again.");
      setSubmitting(false);
      return;
    }

    const { data: ride, error } = await supabase
      .from("rides")
      .insert({
        passenger_id: user.id,
        service_type: serviceType,
        pickup_address: pickup.address,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        destination_address: destination.address,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        distance_km: distanceKm,
        estimated_duration_minutes: durationMinutes,
        estimated_fare: fare.total,
      })
      .select("id")
      .single();

    setSubmitting(false);

    if (error || !ride) {
      toast.error("Couldn't create your ride. Please try again.");
      return;
    }

    router.push(`/passenger/ride/${ride.id}`);
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        {stepIndex > 0 ? (
          <Button variant="ghost" size="icon" onClick={goBack} aria-label="Back">
            <ArrowLeft className="size-4" />
          </Button>
        ) : null}
        <div className="flex flex-1 gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                i <= stepIndex ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {step === "pickup" ? (
        <div className="space-y-4">
          <h1 className="text-lg font-semibold">Where should we pick you up?</h1>
          <LocationPicker
            label="Pickup"
            placeholder="Choose a location"
            value={pickup}
            onChange={setPickup}
            allowCurrentLocation
          />
        </div>
      ) : null}

      {step === "destination" ? (
        <div className="space-y-4">
          <h1 className="text-lg font-semibold">Where are you headed?</h1>
          <LocationPicker
            label="Destination"
            placeholder="Choose a destination"
            value={destination}
            onChange={setDestination}
          />
        </div>
      ) : null}

      {step === "service" ? (
        <div className="space-y-4">
          <h1 className="text-lg font-semibold">Choose your ride</h1>
          <div className="grid grid-cols-2 gap-3">
            {services.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setServiceType(value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border py-6 text-sm font-medium transition-colors",
                  serviceType === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-accent"
                )}
                aria-pressed={serviceType === value}
              >
                <Icon className="size-6" />
                {label}
              </button>
            ))}
            <div className="col-span-2 flex items-center justify-center gap-2 rounded-2xl border border-dashed py-4 text-sm text-muted-foreground">
              <Package className="size-4" />
              Parcel &mdash; coming soon
            </div>
          </div>
        </div>
      ) : null}

      {step === "review" && fare ? (
        <div className="space-y-4">
          <h1 className="text-lg font-semibold">Review your ride</h1>
          <div className="rounded-2xl border p-4 text-sm">
            <p className="text-muted-foreground">Pickup</p>
            <p className="font-medium">{pickup?.address}</p>
            <p className="mt-3 text-muted-foreground">Destination</p>
            <p className="font-medium">{destination?.address}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              ~{distanceKm.toFixed(1)} km &middot; ~{Math.round(durationMinutes)} min
            </p>
          </div>
          <FareCard fare={fare} />
        </div>
      ) : null}

      <div className="mt-8">
        {step === "review" ? (
          <Button className="w-full" size="lg" onClick={confirmRide} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Confirm Ride
          </Button>
        ) : (
          <Button className="w-full" size="lg" onClick={goNext} disabled={!canContinue()}>
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}

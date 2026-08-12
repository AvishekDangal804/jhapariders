"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Bike, Car, Loader2, Package, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocationPicker } from "@/components/shared/location-picker";
import { FareCard } from "@/components/rides/fare-card";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Address, FareBreakdown, ServiceType } from "@/types";

const STEPS = ["pickup", "destination", "service", "review"] as const;
type Step = (typeof STEPS)[number];

const services: { value: Exclude<ServiceType, "parcel">; label: string; icon: typeof Bike }[] = [
  { value: "bike", label: "Bike", icon: Bike },
  { value: "car", label: "Car", icon: Car },
];

interface FareApiResult {
  fare: FareBreakdown;
  distanceKm: number;
  durationMinutes: number;
}

export function BookingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialService = searchParams.get("service") === "car" ? "car" : "bike";

  const [stepIndex, setStepIndex] = useState(0);
  const [pickup, setPickup] = useState<Address | null>(null);
  const [destination, setDestination] = useState<Address | null>(null);
  const [serviceType, setServiceType] = useState<Exclude<ServiceType, "parcel">>(initialService);
  const [submitting, setSubmitting] = useState(false);

  const [fareResult, setFareResult] = useState<FareApiResult | null>(null);
  const [fareLoading, setFareLoading] = useState(false);
  const [fareError, setFareError] = useState<string | null>(null);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const step: Step = STEPS[stepIndex];

  // The server (/api/fare) is the only source of truth for pricing — it
  // reads live rates from the database. Fetched on-demand when entering the
  // review step, triggered from the Continue click handler below (not an
  // effect) so the loading/error state updates aren't cascading renders.
  async function loadFare() {
    if (!pickup || !destination) return;

    setFareLoading(true);
    setFareError(null);
    setFareResult(null);

    try {
      const res = await fetch("/api/fare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickup, destination, serviceType }),
      });
      if (!res.ok) {
        throw new Error((await res.json().catch(() => null))?.error ?? "Couldn't calculate fare");
      }
      setFareResult((await res.json()) as FareApiResult);
    } catch (err) {
      setFareError(err instanceof Error ? err.message : "Couldn't calculate fare");
    } finally {
      setFareLoading(false);
    }
  }

  async function applyCoupon() {
    if (!couponInput.trim() || !fareResult) return;
    setCouponLoading(true);
    setCouponError(null);

    const supabase = createClient();
    const { data, error } = await supabase.rpc("preview_coupon_discount", {
      p_code: couponInput.trim(),
      p_fare: fareResult.fare.total,
    });
    setCouponLoading(false);

    if (error || data == null) {
      setCouponError(error?.message || "Invalid coupon code");
      return;
    }
    setAppliedCoupon({ code: couponInput.trim(), discount: data as number });
    toast.success("Coupon applied!");
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  }

  function canContinue() {
    if (step === "pickup") return !!pickup;
    if (step === "destination") return !!destination;
    return true;
  }

  function goNext() {
    if (stepIndex >= STEPS.length - 1) return;
    const nextIndex = stepIndex + 1;
    setStepIndex(nextIndex);
    if (STEPS[nextIndex] === "review") loadFare();
  }
  function goBack() {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  }

  async function confirmRide() {
    if (!pickup || !destination || !fareResult) return;
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
        distance_km: fareResult.distanceKm,
        estimated_duration_minutes: fareResult.durationMinutes,
        estimated_fare: fareResult.fare.total,
      })
      .select("id")
      .single();

    if (error || !ride) {
      setSubmitting(false);
      toast.error("Couldn't create your ride. Please try again.");
      return;
    }

    if (appliedCoupon) {
      const { error: couponRpcError } = await supabase.rpc("apply_coupon_to_ride", {
        p_ride_id: ride.id,
        p_code: appliedCoupon.code,
      });
      if (couponRpcError) {
        toast.warning(`Ride booked, but the coupon couldn't be applied: ${couponRpcError.message}`);
      }
    }

    // Kick off matching immediately — finds nearby online/verified riders
    // and notifies them. If nobody's eligible right now the RPC itself
    // marks the ride no_driver_found, which the ride detail page shows.
    await supabase.rpc("request_ride_matching", { p_ride_id: ride.id });

    setSubmitting(false);
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

      {step === "review" ? (
        <div className="space-y-4">
          <h1 className="text-lg font-semibold">Review your ride</h1>
          <div className="rounded-2xl border p-4 text-sm">
            <p className="text-muted-foreground">Pickup</p>
            <p className="font-medium">{pickup?.address}</p>
            <p className="mt-3 text-muted-foreground">Destination</p>
            <p className="font-medium">{destination?.address}</p>
            {fareResult ? (
              <p className="mt-3 text-xs text-muted-foreground">
                ~{fareResult.distanceKm.toFixed(1)} km &middot; ~{Math.round(fareResult.durationMinutes)} min
              </p>
            ) : null}
          </div>

          {fareLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Calculating fare...
            </div>
          ) : fareError ? (
            <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              {fareError}
            </div>
          ) : fareResult ? (
            <>
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
                  <span className="flex items-center gap-2 font-medium text-primary">
                    <Tag className="size-4" />
                    {appliedCoupon.code} applied
                  </span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Remove coupon"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Coupon code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={applyCoupon}
                      disabled={couponLoading || !couponInput.trim()}
                    >
                      {couponLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                      Apply
                    </Button>
                  </div>
                  {couponError ? <p className="text-xs text-destructive">{couponError}</p> : null}
                </div>
              )}

              <FareCard
                fare={
                  appliedCoupon
                    ? {
                        ...fareResult.fare,
                        discount: appliedCoupon.discount,
                        total: Math.max(fareResult.fare.total - appliedCoupon.discount, 0),
                      }
                    : fareResult.fare
                }
              />
            </>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8">
        {step === "review" ? (
          <Button
            className="w-full"
            size="lg"
            onClick={confirmRide}
            disabled={submitting || fareLoading || !fareResult}
          >
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

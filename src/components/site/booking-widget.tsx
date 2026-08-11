"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, Car, MapPin, Navigation, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ServiceType } from "@/types";

const services: { value: ServiceType; label: string; icon: typeof Bike }[] = [
  { value: "bike", label: "Bike", icon: Bike },
  { value: "car", label: "Car", icon: Car },
  { value: "parcel", label: "Parcel", icon: Package },
];

export function BookingWidget({ className }: { className?: string }) {
  const router = useRouter();
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [service, setService] = useState<ServiceType>("bike");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({
      pickup,
      destination,
      service,
    });
    // Auth check happens on the passenger route itself (Phase 2): an
    // unauthenticated user is redirected to /login?next=/passenger/book,
    // a logged-in passenger lands directly in the booking flow.
    router.push(`/passenger/book?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "w-full max-w-md rounded-2xl border bg-card p-5 shadow-xl shadow-primary/5",
        className
      )}
    >
      <div className="grid grid-cols-3 gap-2">
        {services.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setService(value)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition-colors",
              service === value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent"
            )}
            aria-pressed={service === value}
          >
            <Icon className="size-5" />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <Label htmlFor="pickup" className="sr-only">
            Pickup location
          </Label>
          <div className="relative">
            <Navigation className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
            <Input
              id="pickup"
              placeholder="Pickup location"
              className="pl-9"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="destination" className="sr-only">
            Destination
          </Label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-destructive" />
            <Input
              id="destination"
              placeholder="Where to?"
              className="pl-9"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <Button type="submit" size="lg" className="mt-4 w-full">
        Get Fare Estimate
      </Button>
    </form>
  );
}

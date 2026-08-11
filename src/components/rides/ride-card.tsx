import Link from "next/link";
import { Bike, Car, MapPin, Navigation, Package } from "lucide-react";
import { RideStatusBadge } from "@/components/rides/ride-status-badge";
import { formatNpr } from "@/lib/fare";
import { cn } from "@/lib/utils";
import type { Ride } from "@/types";

const SERVICE_ICON = { bike: Bike, car: Car, parcel: Package } as const;

export function RideCard({ ride, href, className }: { ride: Ride; href?: string; className?: string }) {
  const Icon = SERVICE_ICON[ride.serviceType];
  const fare = ride.finalFare ?? ride.estimatedFare;
  const date = new Date(ride.createdAt);

  const content = (
    <div className={cn("rounded-2xl border bg-card p-4 transition-colors hover:bg-accent/50", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="size-4.5" />
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-sm font-medium">
              <Navigation className="size-3 shrink-0 text-primary" />
              {ride.pickupAddress}
            </p>
            <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              {ride.destinationAddress}
            </p>
          </div>
        </div>
        <RideStatusBadge status={ride.status} />
      </div>
      <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
        <span>
          {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} &middot;{" "}
          {date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </span>
        {fare != null ? <span className="font-semibold text-foreground">{formatNpr(fare)}</span> : null}
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

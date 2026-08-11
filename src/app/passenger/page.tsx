import type { Metadata } from "next";
import Link from "next/link";
import { Bike, Car, Clock3, LifeBuoy, Package, ShieldAlert } from "lucide-react";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/empty-state";
import { RideCard } from "@/components/rides/ride-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireProfile } from "@/lib/supabase/require-profile";
import { getActiveRide, getRecentRides } from "@/lib/rides/queries";

export const metadata: Metadata = { title: "Passenger Home" };

const quickServices = [
  { label: "Bike", icon: Bike, service: "bike", comingSoon: false },
  { label: "Car", icon: Car, service: "car", comingSoon: false },
  { label: "Parcel", icon: Package, service: "parcel", comingSoon: true },
] as const;

export default async function PassengerHomePage() {
  const user = await requireProfile("passenger");
  const [activeRide, recentRides] = await Promise.all([
    getActiveRide(user.id),
    getRecentRides(user.id, 5),
  ]);

  return (
    <Container className="max-w-3xl py-6 sm:py-8">
      <h1 className="text-xl font-bold sm:text-2xl">Hi, {user.fullName.split(" ")[0]} 👋</h1>
      <p className="mt-1 text-sm text-muted-foreground">Where are you headed today?</p>

      {activeRide ? (
        <Link href={`/passenger/ride/${activeRide.id}`} className="mt-5 block">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-semibold">You have an active ride</p>
                <p className="text-xs text-muted-foreground">Tap to view live status</p>
              </div>
              <Button size="sm">View Ride</Button>
            </CardContent>
          </Card>
        </Link>
      ) : null}

      <div className="mt-6 grid grid-cols-3 gap-3">
        {quickServices.map(({ label, icon: Icon, service, comingSoon }) => (
          <Link
            key={service}
            href={comingSoon ? "/services" : `/passenger/book?service=${service}`}
            className="flex flex-col items-center gap-2 rounded-2xl border bg-card py-5 text-sm font-medium hover:bg-accent"
          >
            <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="size-5" />
            </div>
            {label}
            {comingSoon ? <span className="text-[10px] text-muted-foreground">Coming soon</span> : null}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Link
          href="/safety"
          className="flex items-center gap-3 rounded-2xl border bg-card p-4 text-sm font-medium hover:bg-accent"
        >
          <ShieldAlert className="size-5 text-primary" />
          Safety
        </Link>
        <Link
          href="/help"
          className="flex items-center gap-3 rounded-2xl border bg-card p-4 text-sm font-medium hover:bg-accent"
        >
          <LifeBuoy className="size-5 text-primary" />
          Support
        </Link>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent rides</h2>
          {recentRides.length > 0 ? (
            <Link href="/passenger/history" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          ) : null}
        </div>
        <div className="mt-3 space-y-3">
          {recentRides.length === 0 ? (
            <EmptyState
              icon={Clock3}
              title="No rides yet"
              description="Your ride history will show up here once you book your first trip."
              action={
                <Button asChild size="sm">
                  <Link href="/passenger/book">Book a Ride</Link>
                </Button>
              }
            />
          ) : (
            recentRides.map((ride) => (
              <RideCard key={ride.id} ride={ride} href={`/passenger/ride/${ride.id}`} />
            ))
          )}
        </div>
      </div>
    </Container>
  );
}

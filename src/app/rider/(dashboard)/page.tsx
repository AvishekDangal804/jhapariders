import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, FileWarning } from "lucide-react";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/empty-state";
import { RideCard } from "@/components/rides/ride-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatNpr } from "@/lib/fare";
import { requireRiderState } from "@/lib/supabase/require-rider";
import { getActiveRideForRider, getRecentRidesForRider } from "@/lib/rides/queries";
import { getRiderEarningsSummary } from "@/lib/earnings/queries";
import { OnlineToggle } from "./online-toggle";

export const metadata: Metadata = { title: "Rider Dashboard" };

export default async function RiderHomePage() {
  const state = await requireRiderState();
  const [activeRide, recentRides, earnings] = await Promise.all([
    getActiveRideForRider(state.user.id),
    getRecentRidesForRider(state.user.id, 5),
    getRiderEarningsSummary(state.user.id),
  ]);

  return (
    <Container className="max-w-3xl py-6 sm:py-8">
      <h1 className="text-xl font-bold sm:text-2xl">Hi, {state.user.fullName.split(" ")[0]} 👋</h1>

      {state.verificationStatus === "pending" ? (
        <Alert className="mt-4">
          <FileWarning className="size-4" />
          <AlertTitle>Application under review</AlertTitle>
          <AlertDescription>
            Your documents are being reviewed by our team. You&apos;ll be able to go online once
            you&apos;re approved.
          </AlertDescription>
        </Alert>
      ) : null}
      {state.verificationStatus === "rejected" ? (
        <Alert variant="destructive" className="mt-4">
          <FileWarning className="size-4" />
          <AlertTitle>Application rejected</AlertTitle>
          <AlertDescription>
            Please contact support to find out what needs to be corrected.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-4">
        <OnlineToggle
          riderProfileId={state.riderProfileId}
          initialOnline={state.isOnline}
          canGoOnline={state.verificationStatus === "approved"}
        />
      </div>

      {activeRide ? (
        <Link href={`/rider/ride/${activeRide.id}`} className="mt-4 block">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-semibold">You have an active ride</p>
                <p className="text-xs text-muted-foreground">Tap to view details</p>
              </div>
              <Button size="sm">View Ride</Button>
            </CardContent>
          </Card>
        </Link>
      ) : null}

      <div className="mt-6 grid grid-cols-3 gap-3">
        <StatCard label="Today" value={formatNpr(earnings.todayEarnings)} />
        <StatCard label="This Week" value={formatNpr(earnings.weekEarnings)} />
        <StatCard label="This Month" value={formatNpr(earnings.monthEarnings)} />
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent rides</h2>
          {recentRides.length > 0 ? (
            <Link href="/rider/history" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          ) : null}
        </div>
        <div className="mt-3 space-y-3">
          {recentRides.length === 0 ? (
            <EmptyState
              icon={Clock3}
              title="No rides yet"
              description="Go online to start receiving ride requests."
            />
          ) : (
            recentRides.map((ride) => (
              <RideCard key={ride.id} ride={ride} href={`/rider/ride/${ride.id}`} />
            ))
          )}
        </div>
      </div>
    </Container>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 text-center">
      <p className="text-lg font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EarningsChart } from "@/components/rides/earnings-chart";
import { formatNpr } from "@/lib/fare";
import { requireRiderState } from "@/lib/supabase/require-rider";
import { getRiderDailyEarnings, getRiderEarningsSummary } from "@/lib/earnings/queries";

export const metadata: Metadata = { title: "Earnings" };

export default async function RiderEarningsPage() {
  const state = await requireRiderState();
  const [summary, daily] = await Promise.all([
    getRiderEarningsSummary(state.user.id),
    getRiderDailyEarnings(state.user.id),
  ]);

  const cancellationRate =
    summary.completedRides + summary.cancelledRides > 0
      ? (summary.cancelledRides / (summary.completedRides + summary.cancelledRides)) * 100
      : 0;

  return (
    <Container className="max-w-2xl py-6 sm:py-8">
      <h1 className="text-lg font-semibold">Earnings</h1>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Today" value={formatNpr(summary.todayEarnings)} />
        <Stat label="This Week" value={formatNpr(summary.weekEarnings)} />
        <Stat label="This Month" value={formatNpr(summary.monthEarnings)} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Last 7 days</CardTitle>
        </CardHeader>
        <CardContent>
          <EarningsChart data={daily} />
        </CardContent>
      </Card>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Completed Rides" value={String(summary.completedRides)} />
        <Stat label="Avg. Fare" value={formatNpr(Math.round(summary.averageFare))} />
        <Stat label="Cancellation Rate" value={`${cancellationRate.toFixed(0)}%`} />
      </div>
    </Container>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 text-center">
      <p className="text-lg font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

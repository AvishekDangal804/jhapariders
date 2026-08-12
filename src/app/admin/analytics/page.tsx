import type { Metadata } from "next";
import { Star } from "lucide-react";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { ServiceTypeChart } from "@/components/admin/service-type-chart";
import { UserGrowthChart } from "@/components/admin/user-growth-chart";
import { formatNpr } from "@/lib/fare";
import { getRevenueTrend, getServiceTypeBreakdown, getUserGrowth, getTopRiders } from "@/lib/admin/analytics-queries";
import { requireProfile } from "@/lib/supabase/require-profile";

export const metadata: Metadata = { title: "Analytics" };

export default async function AdminAnalyticsPage() {
  await requireProfile("admin");

  const [revenue, serviceTypes, growth, topRiders] = await Promise.all([
    getRevenueTrend(30),
    getServiceTypeBreakdown(90),
    getUserGrowth(30),
    getTopRiders(5),
  ]);

  const revenue30d = revenue.reduce((sum, d) => sum + d.revenue, 0);
  const commission30d = revenue.reduce((sum, d) => sum + d.commission, 0);
  const rides30d = revenue.reduce((sum, d) => sum + d.rides, 0);
  const newUsers30d = growth.reduce((sum, d) => sum + d.passengers + d.riders, 0);

  return (
    <Container className="max-w-5xl py-6 sm:py-8">
      <h1 className="text-xl font-bold sm:text-2xl">Analytics</h1>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Revenue (30d)" value={formatNpr(revenue30d)} />
        <StatCard label="Commission (30d)" value={formatNpr(commission30d)} />
        <StatCard label="Completed rides (30d)" value={String(rides30d)} />
        <StatCard label="New users (30d)" value={String(newUsers30d)} />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Revenue &amp; commission — last 30 days</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={revenue} />
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rides by service type — last 90 days</CardTitle>
          </CardHeader>
          <CardContent>
            <ServiceTypeChart data={serviceTypes} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top riders</CardTitle>
          </CardHeader>
          <CardContent>
            {topRiders.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No completed rides yet"
                description="Rider leaderboard fills in once trips are completed."
              />
            ) : (
              <div className="space-y-3">
                {topRiders.map((r, i) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                        {i + 1}
                      </span>
                      <span className="font-medium">{r.fullName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        {r.ratingAvg.toFixed(1)}
                      </span>
                      <span>{r.totalRides} rides</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">New passengers &amp; riders — last 30 days</CardTitle>
        </CardHeader>
        <CardContent>
          <UserGrowthChart data={growth} />
        </CardContent>
      </Card>
    </Container>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

import type { Metadata } from "next";
import { Bike, Car, CheckCircle2, DollarSign, Percent, ShieldCheck, Users, XCircle } from "lucide-react";
import { Container } from "@/components/shared/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RidesChart } from "@/components/admin/rides-chart";
import { formatNpr } from "@/lib/fare";
import { getAdminOverviewStats, getDailyRideCounts } from "@/lib/admin/overview-queries";

export const metadata: Metadata = { title: "Admin Overview" };

export default async function AdminOverviewPage() {
  const [stats, daily] = await Promise.all([getAdminOverviewStats(), getDailyRideCounts()]);

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users },
    { label: "Total Riders", value: stats.totalRiders, icon: Bike },
    { label: "Verified Riders", value: stats.verifiedRiders, icon: ShieldCheck },
    { label: "Active Riders", value: stats.activeRiders, icon: Car },
    { label: "Today's Rides", value: stats.todayRides, icon: Car },
    { label: "Completed Rides", value: stats.completedRides, icon: CheckCircle2 },
    { label: "Cancelled Rides", value: stats.cancelledRides, icon: XCircle },
    { label: "Today's Revenue", value: formatNpr(stats.todayRevenue), icon: DollarSign },
    { label: "Platform Commission", value: formatNpr(stats.platformCommission), icon: Percent },
  ];

  return (
    <Container className="max-w-5xl py-6 sm:py-8">
      <h1 className="text-xl font-bold sm:text-2xl">Overview</h1>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-4.5" />
              </div>
              <div>
                <p className="text-lg font-bold leading-tight">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Rides — last 7 days</CardTitle>
        </CardHeader>
        <CardContent>
          <RidesChart data={daily} />
        </CardContent>
      </Card>
    </Container>
  );
}

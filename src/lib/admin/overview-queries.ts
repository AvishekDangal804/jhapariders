import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface AdminOverviewStats {
  totalUsers: number;
  totalRiders: number;
  verifiedRiders: number;
  activeRiders: number;
  todayRides: number;
  completedRides: number;
  cancelledRides: number;
  todayRevenue: number;
  platformCommission: number;
}

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const supabase = await createClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayIso = startOfDay.toISOString();

  const [
    { count: totalUsers },
    { count: totalRiders },
    { count: verifiedRiders },
    { count: activeRiders },
    { count: todayRides },
    { count: completedRides },
    { count: cancelledRides },
    { data: todayCompleted },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("rider_profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("rider_profiles")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "approved"),
    supabase.from("rider_profiles").select("id", { count: "exact", head: true }).eq("is_online", true),
    supabase.from("rides").select("id", { count: "exact", head: true }).gte("created_at", startOfDayIso),
    // A ride's status moves from 'ride_completed' to 'paid' once payment
    // succeeds (Phase 9), so "completed" here has to include both — filtering
    // on 'ride_completed' alone silently drops every ride the moment it's paid.
    supabase.from("rides").select("id", { count: "exact", head: true }).in("status", ["ride_completed", "paid"]),
    supabase.from("rides").select("id", { count: "exact", head: true }).eq("status", "cancelled"),
    supabase
      .from("rides")
      .select("final_fare, platform_share")
      .in("status", ["ride_completed", "paid"])
      .gte("completed_at", startOfDayIso)
      .returns<{ final_fare: number | null; platform_share: number | null }[]>(),
  ]);

  const rows = todayCompleted ?? [];

  return {
    totalUsers: totalUsers ?? 0,
    totalRiders: totalRiders ?? 0,
    verifiedRiders: verifiedRiders ?? 0,
    activeRiders: activeRiders ?? 0,
    todayRides: todayRides ?? 0,
    completedRides: completedRides ?? 0,
    cancelledRides: cancelledRides ?? 0,
    todayRevenue: rows.reduce((acc, r) => acc + (r.final_fare ?? 0), 0),
    platformCommission: rows.reduce((acc, r) => acc + (r.platform_share ?? 0), 0),
  };
}

export interface DailyRideCount {
  date: string;
  label: string;
  rides: number;
}

export async function getDailyRideCounts(days = 7): Promise<DailyRideCount[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("rides")
    .select("created_at")
    .gte("created_at", since)
    .returns<{ created_at: string }[]>();

  const rows = data ?? [];
  const buckets: DailyRideCount[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    const rides = rows.filter((r) => r.created_at.slice(0, 10) === dateKey).length;
    buckets.push({ date: dateKey, label: d.toLocaleDateString("en-US", { weekday: "short" }), rides });
  }

  return buckets;
}

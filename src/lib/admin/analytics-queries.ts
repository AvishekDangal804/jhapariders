import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ServiceType } from "@/types";

// A ride's status moves from 'ride_completed' to 'paid' once payment
// succeeds (Phase 9) — both mean "this trip finished successfully" and
// need to be counted together everywhere revenue/completion is measured.
const FINISHED_STATUSES = ["ride_completed", "paid"] as const;

export interface RevenueDay {
  date: string;
  label: string;
  revenue: number;
  commission: number;
  rides: number;
}

export async function getRevenueTrend(days = 30): Promise<RevenueDay[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("rides")
    .select("completed_at, final_fare, platform_share")
    .in("status", FINISHED_STATUSES)
    .gte("completed_at", since)
    .returns<{ completed_at: string | null; final_fare: number | null; platform_share: number | null }[]>();

  const rows = (data ?? []).filter((r): r is { completed_at: string; final_fare: number | null; platform_share: number | null } => !!r.completed_at);
  const buckets: RevenueDay[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    const dayRows = rows.filter((r) => r.completed_at.slice(0, 10) === dateKey);
    buckets.push({
      date: dateKey,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: dayRows.reduce((sum, r) => sum + (r.final_fare ?? 0), 0),
      commission: dayRows.reduce((sum, r) => sum + (r.platform_share ?? 0), 0),
      rides: dayRows.length,
    });
  }

  return buckets;
}

export interface ServiceTypeCount {
  serviceType: ServiceType;
  count: number;
}

export async function getServiceTypeBreakdown(days = 90): Promise<ServiceTypeCount[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("rides")
    .select("service_type")
    .in("status", FINISHED_STATUSES)
    .gte("created_at", since)
    .returns<{ service_type: ServiceType }[]>();

  const counts = new Map<ServiceType, number>();
  for (const row of data ?? []) {
    counts.set(row.service_type, (counts.get(row.service_type) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([serviceType, count]) => ({ serviceType, count }));
}

export interface UserGrowthDay {
  date: string;
  label: string;
  passengers: number;
  riders: number;
}

export async function getUserGrowth(days = 30): Promise<UserGrowthDay[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("profiles")
    .select("created_at, role")
    .gte("created_at", since)
    .in("role", ["passenger", "rider"])
    .returns<{ created_at: string; role: "passenger" | "rider" }[]>();

  const rows = data ?? [];
  const buckets: UserGrowthDay[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    const dayRows = rows.filter((r) => r.created_at.slice(0, 10) === dateKey);
    buckets.push({
      date: dateKey,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      passengers: dayRows.filter((r) => r.role === "passenger").length,
      riders: dayRows.filter((r) => r.role === "rider").length,
    });
  }

  return buckets;
}

export interface TopRider {
  id: string;
  fullName: string;
  totalRides: number;
  ratingAvg: number;
}

export async function getTopRiders(limit = 5): Promise<TopRider[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rider_profiles")
    .select("total_rides, rating_avg, profile:profiles!rider_profiles_user_id_fkey(id, full_name)")
    .gt("total_rides", 0)
    .order("total_rides", { ascending: false })
    .limit(limit)
    .returns<
      { total_rides: number; rating_avg: number; profile: { id: string; full_name: string } | { id: string; full_name: string }[] | null }[]
    >();

  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    return {
      id: profile?.id ?? "",
      fullName: profile?.full_name ?? "Unknown rider",
      totalRides: row.total_rides,
      ratingAvg: row.rating_avg,
    };
  });
}

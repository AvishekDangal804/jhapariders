import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface EarningsSummary {
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  completedRides: number;
  cancelledRides: number;
  averageFare: number;
}

export interface DailyEarning {
  date: string;
  label: string;
  amount: number;
}

export async function getRiderDailyEarnings(riderId: string, days = 7): Promise<DailyEarning[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("rides")
    .select("final_fare, completed_at")
    .eq("rider_id", riderId)
    .eq("status", "ride_completed")
    .gte("completed_at", since)
    .returns<{ final_fare: number | null; completed_at: string | null }[]>();

  const rows = data ?? [];
  const buckets: DailyEarning[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    const amount = rows
      .filter((r) => r.completed_at?.slice(0, 10) === dateKey)
      .reduce((acc, r) => acc + (r.final_fare ?? 0), 0);
    buckets.push({
      date: dateKey,
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      amount,
    });
  }

  return buckets;
}

export async function getRiderEarningsSummary(riderId: string): Promise<EarningsSummary> {
  const supabase = await createClient();

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: completed } = await supabase
    .from("rides")
    .select("final_fare, completed_at")
    .eq("rider_id", riderId)
    .eq("status", "ride_completed")
    .returns<{ final_fare: number | null; completed_at: string | null }[]>();

  const { count: cancelledRides } = await supabase
    .from("rides")
    .select("id", { count: "exact", head: true })
    .eq("rider_id", riderId)
    .eq("status", "cancelled");

  type CompletedRow = { final_fare: number | null; completed_at: string | null };
  const rows: CompletedRow[] = completed ?? [];
  const sum = (list: CompletedRow[]) => list.reduce((acc, r) => acc + (r.final_fare ?? 0), 0);

  const todayRows = rows.filter((r) => r.completed_at && r.completed_at >= startOfDay);
  const weekRows = rows.filter((r) => r.completed_at && r.completed_at >= startOfWeek);
  const monthRows = rows.filter((r) => r.completed_at && r.completed_at >= startOfMonth);

  return {
    todayEarnings: sum(todayRows),
    weekEarnings: sum(weekRows),
    monthEarnings: sum(monthRows),
    completedRides: rows.length,
    cancelledRides: cancelledRides ?? 0,
    averageFare: rows.length > 0 ? sum(rows) / rows.length : 0,
  };
}

import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { RideStatus, ServiceType } from "@/types";

export interface AdminRideRow {
  id: string;
  passengerName: string | null;
  riderName: string | null;
  pickupAddress: string;
  destinationAddress: string;
  serviceType: ServiceType;
  fare: number | null;
  status: RideStatus;
  createdAt: string;
}

interface RideRow {
  id: string;
  pickup_address: string;
  destination_address: string;
  service_type: ServiceType;
  estimated_fare: number | null;
  final_fare: number | null;
  status: RideStatus;
  created_at: string;
  passenger: { full_name: string } | { full_name: string }[] | null;
  rider: { full_name: string } | { full_name: string }[] | null;
}

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

const PAGE_SIZE = 15;
const STATUS_FILTERS: Record<string, RideStatus[]> = {
  active: ["searching", "driver_assigned", "driver_arriving", "driver_arrived", "ride_started", "payment_pending"],
  completed: ["ride_completed", "paid"],
  cancelled: ["cancelled", "no_driver_found"],
};

export async function getAdminRides({
  page,
  filter,
  rideId,
}: {
  page: number;
  filter?: string;
  rideId?: string;
}): Promise<{ rides: AdminRideRow[]; totalPages: number }> {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("rides")
    .select(
      "id, pickup_address, destination_address, service_type, estimated_fare, final_fare, status, created_at, passenger:profiles!rides_passenger_id_fkey(full_name), rider:profiles!rides_rider_id_fkey(full_name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (rideId) {
    query = query.ilike("id", `${rideId}%`);
  } else if (filter && STATUS_FILTERS[filter]) {
    query = query.in("status", STATUS_FILTERS[filter]);
  }

  const { data, count } = await query.range(from, to).returns<RideRow[]>();

  return {
    rides: (data ?? []).map((row) => ({
      id: row.id,
      passengerName: one(row.passenger)?.full_name ?? null,
      riderName: one(row.rider)?.full_name ?? null,
      pickupAddress: row.pickup_address,
      destinationAddress: row.destination_address,
      serviceType: row.service_type,
      fare: row.final_fare ?? row.estimated_fare,
      status: row.status,
      createdAt: row.created_at,
    })),
    totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
  };
}

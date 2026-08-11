import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Ride } from "@/types";

const RIDE_SELECT = `
  id, passenger_id, rider_id, service_type,
  pickup_address, pickup_lat, pickup_lng,
  destination_address, destination_lat, destination_lng,
  distance_km, estimated_duration_minutes, estimated_fare, final_fare,
  status, payment_status, payment_method,
  created_at, accepted_at, started_at, completed_at, cancelled_at,
  rider:profiles!rides_rider_id_fkey(full_name),
  passenger:profiles!rides_passenger_id_fkey(full_name)
`;

interface RideRow {
  id: string;
  passenger_id: string;
  rider_id: string | null;
  service_type: Ride["serviceType"];
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  destination_address: string;
  destination_lat: number;
  destination_lng: number;
  distance_km: number | null;
  estimated_duration_minutes: number | null;
  estimated_fare: number | null;
  final_fare: number | null;
  status: Ride["status"];
  payment_status: Ride["paymentStatus"];
  payment_method: Ride["paymentMethod"];
  created_at: string;
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  rider: { full_name: string } | { full_name: string }[] | null;
  passenger: { full_name: string } | { full_name: string }[] | null;
}

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapRide(row: RideRow): Ride {
  return {
    id: row.id,
    passengerId: row.passenger_id,
    passengerName: one(row.passenger)?.full_name ?? null,
    riderId: row.rider_id,
    riderName: one(row.rider)?.full_name ?? null,
    serviceType: row.service_type,
    pickupAddress: row.pickup_address,
    pickupLat: row.pickup_lat,
    pickupLng: row.pickup_lng,
    destinationAddress: row.destination_address,
    destinationLat: row.destination_lat,
    destinationLng: row.destination_lng,
    distanceKm: row.distance_km,
    estimatedDurationMinutes: row.estimated_duration_minutes,
    estimatedFare: row.estimated_fare,
    finalFare: row.final_fare,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
  };
}

const ACTIVE_STATUSES = [
  "searching",
  "driver_assigned",
  "driver_arriving",
  "driver_arrived",
  "ride_started",
  "payment_pending",
] as const;

type OwnerColumn = "passenger_id" | "rider_id";

async function getActiveRideFor(column: OwnerColumn, id: string): Promise<Ride | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rides")
    .select(RIDE_SELECT)
    .eq(column, id)
    .in("status", ACTIVE_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<RideRow>();

  return data ? mapRide(data) : null;
}

async function getRecentRidesFor(column: OwnerColumn, id: string, limit: number): Promise<Ride[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rides")
    .select(RIDE_SELECT)
    .eq(column, id)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<RideRow[]>();

  return (data ?? []).map(mapRide);
}

const PAGE_SIZE = 10;

async function getRideHistoryFor(
  column: OwnerColumn,
  id: string,
  page: number
): Promise<{ rides: Ride[]; totalPages: number }> {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, count } = await supabase
    .from("rides")
    .select(RIDE_SELECT, { count: "exact" })
    .eq(column, id)
    .order("created_at", { ascending: false })
    .range(from, to)
    .returns<RideRow[]>();

  return {
    rides: (data ?? []).map(mapRide),
    totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
  };
}

export const getActiveRide = (passengerId: string) => getActiveRideFor("passenger_id", passengerId);
export const getRecentRides = (passengerId: string, limit = 5) =>
  getRecentRidesFor("passenger_id", passengerId, limit);
export const getRideHistory = (passengerId: string, page: number) =>
  getRideHistoryFor("passenger_id", passengerId, page);

export const getActiveRideForRider = (riderId: string) => getActiveRideFor("rider_id", riderId);
export const getRecentRidesForRider = (riderId: string, limit = 5) =>
  getRecentRidesFor("rider_id", riderId, limit);
export const getRideHistoryForRider = (riderId: string, page: number) =>
  getRideHistoryFor("rider_id", riderId, page);

export async function getRideById(rideId: string): Promise<Ride | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rides")
    .select(RIDE_SELECT)
    .eq("id", rideId)
    .maybeSingle<RideRow>();

  return data ? mapRide(data) : null;
}

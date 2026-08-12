import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { EmergencyStatus } from "@/types";

export interface EmergencyEventRow {
  id: string;
  rideId: string;
  lat: number;
  lng: number;
  description: string | null;
  status: EmergencyStatus;
  createdAt: string;
  resolvedAt: string | null;
  reporterName: string | null;
  pickupAddress: string | null;
  destinationAddress: string | null;
}

interface RawRow {
  id: string;
  ride_id: string;
  lat: number;
  lng: number;
  description: string | null;
  status: EmergencyStatus;
  created_at: string;
  resolved_at: string | null;
  reporter: { full_name: string } | { full_name: string }[] | null;
  ride: { pickup_address: string; destination_address: string } | { pickup_address: string; destination_address: string }[] | null;
}

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getEmergencyEvents(): Promise<EmergencyEventRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("emergency_events")
    .select(
      "id, ride_id, lat, lng, description, status, created_at, resolved_at, reporter:profiles!emergency_events_user_id_fkey(full_name), ride:rides!emergency_events_ride_id_fkey(pickup_address, destination_address)"
    )
    .order("created_at", { ascending: false })
    .returns<RawRow[]>();

  return (data ?? []).map((row) => ({
    id: row.id,
    rideId: row.ride_id,
    lat: row.lat,
    lng: row.lng,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    reporterName: one(row.reporter)?.full_name ?? null,
    pickupAddress: one(row.ride)?.pickup_address ?? null,
    destinationAddress: one(row.ride)?.destination_address ?? null,
  }));
}

import type { Address } from "@/types";

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  /** [lng, lat][] polyline, for drawing the real route once Mapbox GL is wired into MapView. */
  geometry: [number, number][] | null;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Real driving distance/duration via Mapbox Directions. Returns null
// whenever the token isn't configured (or the request fails) so callers can
// fall back to the haversine estimate — this must never throw and break
// the booking flow just because a map API key is missing.
export async function getRoute(pickup: Address, destination: Address): Promise<RouteResult | null> {
  if (!MAPBOX_TOKEN) return null;

  const coords = `${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&overview=simplified&access_token=${MAPBOX_TOKEN}`;

  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return null;

    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route) return null;

    return {
      distanceKm: route.distance / 1000,
      durationMinutes: route.duration / 60,
      geometry: route.geometry?.coordinates ?? null,
    };
  } catch {
    return null;
  }
}

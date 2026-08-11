import { jhapaMapCenter } from "@/config/service-areas";
import type { Address } from "@/types";

export interface GeocodeSuggestion extends Address {
  id: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Address search restricted to a bounding box around Jhapa so results stay
// locally relevant. Returns [] whenever no token is configured (or the
// request fails) — callers should keep the static service-area list as the
// fallback picker in that case, never block booking on this succeeding.
export async function searchAddress(query: string): Promise<GeocodeSuggestion[]> {
  if (!MAPBOX_TOKEN || query.trim().length < 3) return [];

  const bbox = "87.65,26.35,88.25,26.85"; // roughly Jhapa district
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
    `?access_token=${MAPBOX_TOKEN}&bbox=${bbox}&proximity=${jhapaMapCenter.lng},${jhapaMapCenter.lat}&limit=6`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const features: {
      id: string;
      place_name: string;
      center: [number, number];
    }[] = data?.features ?? [];

    return features.map((f) => ({
      id: f.id,
      address: f.place_name,
      lng: f.center[0],
      lat: f.center[1],
    }));
  } catch {
    return [];
  }
}

export const isMapboxConfigured = Boolean(MAPBOX_TOKEN);

import type { GeoPoint } from "@/types";

// Straight-line distance — a reasonable stand-in until Phase 7 wires up the
// Mapbox Directions API for real road distance/duration.
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

const AVG_SPEED_KMH: Record<"bike" | "car" | "parcel", number> = {
  bike: 28,
  car: 24,
  parcel: 28,
};

export function estimateDurationMinutes(distanceKm: number, serviceType: keyof typeof AVG_SPEED_KMH) {
  return Math.max((distanceKm / AVG_SPEED_KMH[serviceType]) * 60, 3);
}

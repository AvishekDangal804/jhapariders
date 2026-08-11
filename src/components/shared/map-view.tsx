"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GeoPoint } from "@/types";

// Provider-agnostic map surface. When `NEXT_PUBLIC_MAPBOX_TOKEN` is set this
// renders the real Mapbox map (see mapbox-map-view.tsx); otherwise — and
// whenever the token is missing in any environment — it renders a
// lightweight demo fallback so the app never crashes or blocks on a missing
// API key (see DemoMapView below).
export interface MapMarker extends GeoPoint {
  id: string;
  label: string;
  variant?: "primary" | "muted";
}

interface MapViewProps {
  markers?: MapMarker[];
  bounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  className?: string;
}

const hasMapboxToken = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);

// mapbox-gl touches `window` on import, so it's loaded client-side only.
const MapboxMapView = dynamic(
  () => import("./mapbox-map-view").then((mod) => mod.MapboxMapView),
  { ssr: false, loading: () => <div className="aspect-4/3 w-full animate-pulse rounded-2xl bg-muted" /> }
);

export function MapView({ markers = [], bounds, className }: MapViewProps) {
  if (hasMapboxToken) {
    return <MapboxMapView markers={markers} className={className} />;
  }

  return <DemoMapView markers={markers} bounds={bounds} className={className} />;
}

function DemoMapView({ markers = [], bounds, className }: MapViewProps) {
  const computedBounds = bounds ?? computeBounds(markers);

  return (
    <div
      className={cn(
        "relative aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900",
        className
      )}
      role="img"
      aria-label="Map showing JhapaRide service areas"
    >
      <span className="absolute left-3 top-3 z-10 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow">
        Demo map mode
      </span>

      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full opacity-30" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`h-${i}`} x1="0" y1={i * 8.3} x2="100" y2={i * 8.3} stroke="currentColor" strokeWidth="0.2" className="text-primary" />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`v-${i}`} x1={i * 8.3} y1="0" x2={i * 8.3} y2="100" stroke="currentColor" strokeWidth="0.2" className="text-primary" />
        ))}
      </svg>

      {markers.map((marker) => {
        const { x, y } = project(marker, computedBounds);
        return (
          <div
            key={marker.id}
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div className="flex flex-col items-center">
              <MapPin
                className={cn(
                  "size-6 drop-shadow",
                  marker.variant === "muted" ? "fill-muted text-muted-foreground" : "fill-primary text-primary"
                )}
              />
              <span className="mt-0.5 rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] font-medium shadow">
                {marker.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function computeBounds(markers: GeoPoint[]) {
  if (markers.length === 0) {
    return { minLat: 26.4, maxLat: 26.75, minLng: 87.65, maxLng: 88.2 };
  }
  const lats = markers.map((m) => m.lat);
  const lngs = markers.map((m) => m.lng);
  const pad = 0.03;
  return {
    minLat: Math.min(...lats) - pad,
    maxLat: Math.max(...lats) + pad,
    minLng: Math.min(...lngs) - pad,
    maxLng: Math.max(...lngs) + pad,
  };
}

function project(
  point: GeoPoint,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
) {
  const x = ((point.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
  const y = 100 - ((point.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;
  return { x: clamp(x, 4, 96), y: clamp(y, 6, 96) };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

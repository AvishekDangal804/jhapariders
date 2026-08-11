"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { cn } from "@/lib/utils";
import type { MapMarker } from "./map-view";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export function MapboxMapView({ markers, className }: { markers: MapMarker[]; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [87.99, 26.605],
      zoom: 10,
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (markers.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();

    markers.forEach((marker) => {
      const el = document.createElement("div");
      el.className = "flex flex-col items-center";
      el.innerHTML = `
        <div class="rounded-full ${marker.variant === "muted" ? "bg-muted-foreground" : "bg-primary"} size-4 border-2 border-white shadow-md"></div>
        <span class="mt-1 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium shadow whitespace-nowrap">${marker.label}</span>
      `;
      const m = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([marker.lng, marker.lat])
        .addTo(map);
      markersRef.current.push(m);
      bounds.extend([marker.lng, marker.lat]);
    });

    if (markers.length === 1) {
      map.flyTo({ center: [markers[0].lng, markers[0].lat], zoom: 13 });
    } else {
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 0 });
    }
  }, [markers]);

  return (
    <div
      ref={containerRef}
      className={cn("aspect-4/3 w-full overflow-hidden rounded-2xl border", className)}
    />
  );
}

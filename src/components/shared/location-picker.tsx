"use client";

import { useState } from "react";
import { Check, Crosshair, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { jhapaServiceAreas } from "@/config/service-areas";
import { cn } from "@/lib/utils";
import type { Address } from "@/types";

// TODO(Phase 6/14): once `service_areas` is seeded and admin-manageable in
// the database, fetch the active list from there instead of this static
// config (which exists precisely as the pre-DB fallback — see
// config/service-areas.ts).
const areas = jhapaServiceAreas.filter((a) => a.isActive);

export function LocationPicker({
  label,
  placeholder,
  value,
  onChange,
  allowCurrentLocation = false,
}: {
  label: string;
  placeholder: string;
  value: Address | null;
  onChange: (address: Address) => void;
  allowCurrentLocation?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);

  const filtered = areas.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));

  function useCurrentLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          address: "Current Location",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocating(false);
        setOpen(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left hover:bg-accent"
        >
          <MapPin className="size-4 shrink-0 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-muted-foreground">{label}</span>
            <span className={cn("block truncate text-sm", !value && "text-muted-foreground")}>
              {value?.address ?? placeholder}
            </span>
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <div className="border-b p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search Jhapa towns..."
              className="h-9 pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        {allowCurrentLocation ? (
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating}
            className="flex w-full items-center gap-2.5 border-b px-3.5 py-2.5 text-sm font-medium text-primary hover:bg-accent disabled:opacity-60"
          >
            <Crosshair className="size-4" />
            {locating ? "Locating..." : "Use current location"}
          </button>
        ) : null}
        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">No matching towns</p>
          ) : (
            filtered.map((area) => (
              <button
                key={area.slug}
                type="button"
                onClick={() => {
                  onChange({ address: area.name, lat: area.lat, lng: area.lng });
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-accent"
              >
                {area.name}
                {value?.address === area.name ? <Check className="size-4 text-primary" /> : null}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

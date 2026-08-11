"use client";

import { useEffect, useState } from "react";
import { Check, Crosshair, Loader2, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { jhapaServiceAreas } from "@/config/service-areas";
import { isMapboxConfigured, searchAddress, type GeocodeSuggestion } from "@/lib/maps/geocoding";
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
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [searching, setSearching] = useState(false);

  const filteredAreas = areas.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (!isMapboxConfigured || query.trim().length < 3) return;

    let cancelled = false;
    const handle = setTimeout(() => {
      searchAddress(query).then((results) => {
        if (!cancelled) {
          setSuggestions(results);
          setSearching(false);
        }
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  function handleQueryChange(next: string) {
    setQuery(next);
    if (!isMapboxConfigured || next.trim().length < 3) {
      setSuggestions([]);
      setSearching(false);
    } else {
      setSearching(true);
    }
  }

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
              placeholder={isMapboxConfigured ? "Search for an address..." : "Search Jhapa towns..."}
              className="h-9 pl-8"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
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

        {isMapboxConfigured && query.trim().length >= 3 ? (
          <div className="max-h-64 overflow-y-auto border-b p-1">
            {searching ? (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Searching...
              </div>
            ) : suggestions.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">No results</p>
            ) : (
              suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onChange({ address: s.address, lat: s.lat, lng: s.lng });
                    setOpen(false);
                  }}
                  className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{s.address}</span>
                </button>
              ))
            )}
          </div>
        ) : null}

        <div className="max-h-64 overflow-y-auto p-1">
          <p className="px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Popular in Jhapa
          </p>
          {filteredAreas.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">No matching towns</p>
          ) : (
            filteredAreas.map((area) => (
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

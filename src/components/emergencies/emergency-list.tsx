"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { createClient } from "@/lib/supabase/client";
import { ensureRealtimeAuth } from "@/lib/supabase/ensure-realtime-auth";
import { cn } from "@/lib/utils";
import type { EmergencyEventRow } from "@/lib/emergencies/queries";
import type { EmergencyStatus } from "@/types";

const STATUS_VARIANT: Record<EmergencyStatus, "default" | "secondary" | "outline"> = {
  active: "default",
  acknowledged: "secondary",
  resolved: "outline",
};

export function EmergencyList({ initial }: { initial: EmergencyEventRow[] }) {
  const [events, setEvents] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("admin-emergencies");

    ensureRealtimeAuth(supabase).then(() => {
      channel
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "emergency_events" },
          () => {
            toast.error("New SOS alert received!");
            // Re-fetch is simplest & most correct here (need joined reporter/ride
            // data the realtime payload doesn't include) — trigger a soft reload.
            location.reload();
          }
        )
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "emergency_events" }, (payload) => {
          const row = payload.new as { id: string; status: EmergencyStatus; resolved_at: string | null };
          setEvents((prev) => prev.map((e) => (e.id === row.id ? { ...e, status: row.status, resolvedAt: row.resolved_at } : e)));
        })
        .subscribe();
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function updateStatus(id: string, status: EmergencyStatus) {
    setBusyId(id);
    const supabase = createClient();
    const { error } = await supabase.rpc("update_emergency_status", { p_event_id: id, p_status: status });
    setBusyId(null);

    if (error) {
      toast.error(error.message || "Could not update status.");
      return;
    }
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    toast.success(`Marked as ${status}.`);
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="No SOS alerts"
        description="Emergency reports from active rides will appear here in real time."
        className="mt-8"
      />
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {events.map((e) => (
        <Card key={e.id} className={cn(e.status === "active" && "border-destructive/50 bg-destructive/5")}>
          <CardContent className="space-y-2 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle
                  className={cn("mt-0.5 size-4 shrink-0", e.status === "active" ? "text-destructive" : "text-muted-foreground")}
                />
                <div>
                  <p className="text-sm font-semibold">{e.reporterName ?? "Unknown user"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <Badge variant={STATUS_VARIANT[e.status]} className="capitalize">
                {e.status}
              </Badge>
            </div>

            {e.pickupAddress ? (
              <p className="text-xs text-muted-foreground">
                Ride: {e.pickupAddress} &rarr; {e.destinationAddress}
              </p>
            ) : null}

            <a
              href={`https://www.google.com/maps?q=${e.lat},${e.lng}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <MapPin className="size-3.5" />
              View reported location
            </a>

            {e.description ? <p className="text-sm">{e.description}</p> : null}

            {e.status !== "resolved" ? (
              <div className="flex gap-2 pt-1">
                {e.status === "active" ? (
                  <Button size="sm" variant="secondary" disabled={busyId === e.id} onClick={() => updateStatus(e.id, "acknowledged")}>
                    {busyId === e.id ? <Loader2 className="size-3.5 animate-spin" /> : null}
                    Acknowledge
                  </Button>
                ) : null}
                <Button size="sm" disabled={busyId === e.id} onClick={() => updateStatus(e.id, "resolved")}>
                  {busyId === e.id ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                  Resolve
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

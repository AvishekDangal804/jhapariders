"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/lib/supabase/client";

function getCurrentPosition(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  });
}

export function SosButton({
  rideId,
  fallbackLat,
  fallbackLng,
}: {
  rideId: string;
  fallbackLat?: number;
  fallbackLng?: number;
}) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function trigger() {
    setSending(true);
    const position = await getCurrentPosition();
    const lat = position?.coords.latitude ?? fallbackLat ?? null;
    const lng = position?.coords.longitude ?? fallbackLng ?? null;

    if (lat == null || lng == null) {
      setSending(false);
      toast.error("Could not determine your location. Please call emergency services directly if needed.");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.rpc("report_emergency", {
      p_ride_id: rideId,
      p_lat: lat,
      p_lng: lng,
      p_description: null,
    });
    setSending(false);

    if (error) {
      toast.error(error.message || "Could not send SOS alert. Please call emergency services directly.");
      return;
    }
    setSent(true);
    toast.success("SOS alert sent. Our team has been notified.");
  }

  if (sent) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
        <AlertTriangle className="size-4 shrink-0" />
        SOS alert sent — help is on the way.
      </div>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <AlertTriangle className="size-4" />
          SOS Emergency
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send an SOS alert?</AlertDialogTitle>
          <AlertDialogDescription>
            This immediately notifies JhapaRide&apos;s safety team with your live location and ride details. Only use
            this in a genuine emergency.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              trigger();
            }}
            disabled={sending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : null}
            Send SOS
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

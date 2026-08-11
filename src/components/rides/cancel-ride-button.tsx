"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

const reasons = [
  "Changed plans",
  "Wrong pickup location",
  "Waiting too long",
  "Emergency",
  "Other",
];

export function CancelRideButton({ rideId }: { rideId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(reasons[0]);
  const [submitting, setSubmitting] = useState(false);

  async function handleCancel() {
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("cancel_ride", { p_ride_id: rideId, p_reason: reason });
    setSubmitting(false);

    if (error) {
      toast.error(error.message || "Couldn't cancel this ride.");
      return;
    }
    setOpen(false);
    toast.success("Ride cancelled");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full text-destructive hover:text-destructive">
          Cancel Ride
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this ride?</DialogTitle>
          <DialogDescription>Let us know why you&apos;re cancelling.</DialogDescription>
        </DialogHeader>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {reasons.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Keep Ride
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Confirm Cancellation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

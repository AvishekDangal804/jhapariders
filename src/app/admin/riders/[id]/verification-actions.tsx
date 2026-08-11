"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { logAdminAction } from "@/lib/admin/log-action";
import type { VerificationStatus } from "@/types";

export function VerificationActions({
  riderProfileId,
  vehicleId,
  currentStatus,
}: {
  riderProfileId: string;
  vehicleId: string | null;
  currentStatus: VerificationStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function setStatus(next: VerificationStatus) {
    setLoading(next);
    const supabase = createClient();

    const { error } = await supabase
      .from("rider_profiles")
      .update({ verification_status: next })
      .eq("id", riderProfileId);

    if (!error && vehicleId) {
      const vehicleStatus = next === "approved" ? "approved" : next === "rejected" ? "rejected" : "pending";
      await supabase.from("vehicles").update({ status: vehicleStatus }).eq("id", vehicleId);
    }

    setLoading(null);

    if (error) {
      toast.error("Couldn't update this rider.");
      return;
    }

    await logAdminAction(`Set rider verification to ${next}`, "rider_profiles", riderProfileId);
    toast.success(`Rider ${next}`);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        disabled={loading !== null || currentStatus === "approved"}
        onClick={() => setStatus("approved")}
      >
        {loading === "approved" ? <Loader2 className="size-4 animate-spin" /> : null}
        Approve
      </Button>
      <Button
        variant="outline"
        disabled={loading !== null || currentStatus === "rejected"}
        onClick={() => setStatus("rejected")}
      >
        {loading === "rejected" ? <Loader2 className="size-4 animate-spin" /> : null}
        Reject
      </Button>
      <Button
        variant="outline"
        disabled={loading !== null || currentStatus === "pending"}
        onClick={() => setStatus("pending")}
      >
        {loading === "pending" ? <Loader2 className="size-4 animate-spin" /> : null}
        Request Changes
      </Button>
    </div>
  );
}

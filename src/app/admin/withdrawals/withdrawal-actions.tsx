"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { logAdminAction } from "@/lib/admin/log-action";

export function WithdrawalActions({ withdrawalId }: { withdrawalId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function process(approve: boolean) {
    setLoading(approve ? "approve" : "reject");
    const supabase = createClient();
    const { error } = await supabase.rpc("process_withdrawal", {
      p_withdrawal_id: withdrawalId,
      p_approve: approve,
      p_notes: null,
    });
    setLoading(null);

    if (error) {
      toast.error(error.message || "Couldn't process this withdrawal.");
      return;
    }
    await logAdminAction(approve ? "Approved withdrawal" : "Rejected withdrawal", "withdrawals", withdrawalId);
    toast.success(approve ? "Withdrawal approved and paid out" : "Withdrawal rejected");
    router.refresh();
  }

  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" disabled={loading !== null} onClick={() => process(true)}>
        {loading === "approve" ? <Loader2 className="size-3.5 animate-spin" /> : null}
        Approve
      </Button>
      <Button size="sm" variant="outline" disabled={loading !== null} onClick={() => process(false)}>
        {loading === "reject" ? <Loader2 className="size-3.5 animate-spin" /> : null}
        Reject
      </Button>
    </div>
  );
}

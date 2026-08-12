"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
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
import { createClient } from "@/lib/supabase/client";
import { formatNpr } from "@/lib/fare";

const AMOUNTS = [200, 500, 1000, 2000];

// No real payment gateway is wired up for this build, so wallet payments
// are exercised via this explicit, capped, clearly-labeled demo top-up
// instead — never presented as a real money transfer.
export function DemoTopupButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function topup(amount: number) {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("demo_topup_wallet", { p_amount: amount });
    setLoading(false);

    if (error) {
      toast.error(error.message || "Top-up failed.");
      return;
    }
    toast.success(`Added ${formatNpr(amount)} (demo)`);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-1.5">
          <Plus className="size-3.5" />
          Add Money
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add money to wallet</DialogTitle>
          <DialogDescription>
            Demo mode — no real payment gateway is connected. This simulates a top-up so you can
            try wallet payments.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {AMOUNTS.map((amount) => (
            <Button key={amount} variant="outline" disabled={loading} onClick={() => topup(amount)}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {formatNpr(amount)}
            </Button>
          ))}
        </div>
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}

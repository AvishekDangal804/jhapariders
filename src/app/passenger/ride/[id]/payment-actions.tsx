"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { formatNpr } from "@/lib/fare";
import type { PaymentMethod } from "@/types";

export function PaymentActions({ rideId, fare }: { rideId: string; fare: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState<PaymentMethod | null>(null);

  async function pay(method: Extract<PaymentMethod, "cash" | "wallet">) {
    setLoading(method);
    const supabase = createClient();
    const { error } = await supabase.rpc("pay_for_ride", { p_ride_id: rideId, p_method: method });
    setLoading(null);

    if (error) {
      toast.error(error.message || "Payment failed. Please try again.");
      return;
    }
    toast.success("Payment successful!");
    router.refresh();
  }

  return (
    <Card className="mt-4 border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-base">Pay {formatNpr(fare)}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={() => pay("cash")} disabled={loading !== null}>
          {loading === "cash" ? <Loader2 className="size-4 animate-spin" /> : <Banknote className="size-4" />}
          Cash
        </Button>
        <Button onClick={() => pay("wallet")} disabled={loading !== null}>
          {loading === "wallet" ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
          Wallet
        </Button>
      </CardContent>
    </Card>
  );
}

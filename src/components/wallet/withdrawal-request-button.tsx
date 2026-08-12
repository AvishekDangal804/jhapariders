"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wallet } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function WithdrawalRequestButton({ balance }: { balance: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Bank Transfer");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0 || numericAmount > balance) {
      toast.error("Enter an amount up to your available balance.");
      return;
    }
    if (!reference.trim()) {
      toast.error("Enter an account reference (e.g. bank account or wallet number).");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("withdrawals").insert({
      rider_id: user.id,
      amount: numericAmount,
      payment_method: method,
      account_reference: reference,
    });
    setLoading(false);

    if (error) {
      toast.error("Couldn't submit withdrawal request.");
      return;
    }
    toast.success("Withdrawal requested — an admin will process it shortly.");
    setOpen(false);
    setAmount("");
    setReference("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-1.5" disabled={balance <= 0}>
          <Wallet className="size-3.5" />
          Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request withdrawal</DialogTitle>
          <DialogDescription>Funds are sent once an admin approves your request.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="amount">Amount (Rs.)</Label>
            <Input
              id="amount"
              type="number"
              min={1}
              max={balance}
              className="mt-1.5"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="method">Payment method</Label>
            <Input id="method" className="mt-1.5" value={method} onChange={(e) => setMethod(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="reference">Account reference</Label>
            <Input
              id="reference"
              placeholder="Bank account / mobile wallet number"
              className="mt-1.5"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

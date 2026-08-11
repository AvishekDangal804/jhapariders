import { Wallet } from "lucide-react";
import { formatNpr } from "@/lib/fare";

export function WalletCard({ balance }: { balance: number }) {
  return (
    <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
      <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
        <Wallet className="size-4" />
        Wallet balance
      </div>
      <p className="mt-2 text-3xl font-bold">{formatNpr(balance)}</p>
    </div>
  );
}
